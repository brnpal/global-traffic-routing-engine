import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Source, Layer, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Activity, Server, Zap, Trash2, Database, Network } from 'lucide-react'
import * as turf from '@turf/helpers'
import greatCircle from '@turf/great-circle'
import { LocalMetroPanel } from './components/LocalMetroPanel'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const WS_URL = 'ws://localhost:8000/ws'

export type NodeType = 'core' | 'edge'

export interface Node {
    id: string
    name: string
    lat: number
    lng: number
    type: NodeType
}

interface User {
    id: string
    lat: number
    lng: number
}

interface Route {
    id: string
    user: User
    node: Node
    distance_km: number
    timestamp: number
}

// Predefined Infrastructure
const INITIAL_NODES: Node[] = [
    // Core "Origin" Data Centers
    { id: 'core-lockport', name: 'Lockport, NY', lat: 43.1706, lng: -78.6946, type: 'core' },
    { id: 'core-quincy', name: 'Quincy, WA', lat: 47.2343, lng: -119.8526, type: 'core' },
    { id: 'core-omaha', name: 'Omaha, NE', lat: 41.2565, lng: -95.9345, type: 'core' },
    { id: 'core-singapore', name: 'Singapore (SG3)', lat: 1.3521, lng: 103.8198, type: 'core' },

    // Edge PoPs
    { id: 'edge-ashburn', name: 'Ashburn, VA', lat: 39.0438, lng: -77.4874, type: 'edge' },
    { id: 'edge-sunnyvale', name: 'Sunnyvale, CA', lat: 37.3688, lng: -122.0363, type: 'edge' },
    { id: 'edge-seattle', name: 'Seattle, WA', lat: 47.6062, lng: -122.3321, type: 'edge' },
    { id: 'edge-losangeles', name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, type: 'edge' },
    { id: 'edge-phoenix', name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, type: 'edge' },
    { id: 'edge-atlanta', name: 'Atlanta, GA', lat: 33.7490, lng: -84.3880, type: 'edge' },
    { id: 'edge-miami', name: 'Miami, FL', lat: 25.7617, lng: -80.1918, type: 'edge' },
    { id: 'edge-dallas', name: 'Dallas, TX', lat: 32.7767, lng: -96.7970, type: 'edge' },
    { id: 'edge-chicago', name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, type: 'edge' },
    { id: 'edge-minneapolis', name: 'Minneapolis, MN', lat: 44.9778, lng: -93.2650, type: 'edge' },
    { id: 'edge-denver', name: 'Denver, CO', lat: 39.7392, lng: -104.9903, type: 'edge' },
    { id: 'edge-tokyo', name: 'Tokyo, JP', lat: 35.6762, lng: 139.6503, type: 'edge' },
    { id: 'edge-hongkong', name: 'Hong Kong', lat: 22.3193, lng: 114.1694, type: 'edge' },
    { id: 'edge-sydney', name: 'Sydney, AU', lat: -33.8688, lng: 151.2093, type: 'edge' },
]

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function App() {
    const [nodes] = useState<Node[]>(INITIAL_NODES)
    const [users, setUsers] = useState<User[]>([])
    const [routes, setRoutes] = useState<Route[]>([])
    const [tick, setTick] = useState(0) // Force re-render for fading routes

    // UI State
    const [mode, setMode] = useState<'user' | 'idle'>('idle')
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)
    const [activeUserId, setActiveUserId] = useState<string | null>(null)
    const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        connectWs()
        return () => {
            wsRef.current?.close()
        }
    }, [])

    useEffect(() => {
        // Trigger a re-render every second so the routeFeatures memo can naturally hide old routes
        const interval = setInterval(() => {
            setTick(t => t + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const connectWs = () => {
        setWsStatus('connecting')
        const ws = new WebSocket(WS_URL)

        ws.onopen = () => setWsStatus('connected')
        ws.onclose = () => {
            setWsStatus('disconnected')
            setTimeout(connectWs, 3000)
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === 'ROUTING_DECISION') {
                const route: Route = {
                    id: Math.random().toString(36).substr(2, 9),
                    user: data.user,
                    node: data.node,
                    distance_km: data.distance_km,
                    timestamp: Date.now()
                }
                setRoutes(prev => [...prev, route])
            }
        }

        wsRef.current = ws
    }

    const handleMapClick = useCallback((e: any) => {
        if (mode === 'idle') return

        const lat = e.lngLat.lat
        const lng = e.lngLat.lng
        const id = Math.random().toString(36).substr(2, 9)

        if (mode === 'user') {
            const newUser = { id, lat, lng }
            setUsers(prev => [...prev, newUser])
            setMode('idle')

            if (wsRef.current?.readyState === WebSocket.OPEN && nodes.length > 0) {
                const edgeNodes = nodes.filter(n => n.type === 'edge')
                wsRef.current.send(JSON.stringify({
                    type: 'SIMULATE_TRAFFIC',
                    nodes: edgeNodes,
                    user: newUser
                }))
            }
        }
    }, [mode, nodes])

    const handleClear = () => {
        setUsers([])
        setRoutes([])
        // We do not clear predefined nodes anymore
    }

    const routeFeatures = useMemo(() => {
        const now = Date.now()
        // Keep routes that are new (< 3 seconds old) OR belong to the hovered user
        const activeRoutes = routes.filter(r => (now - r.timestamp < 3000) || r.user.id === hoveredUserId)
        const coreNodes = nodes.filter(n => n.type === 'core')

        const features: any[] = []

        activeRoutes.forEach(route => {
            const start = turf.point([route.user.lng, route.user.lat])
            const edge = turf.point([route.node.lng, route.node.lat])
            features.push(greatCircle(start, edge, { properties: { id: route.id, type: 'user-to-edge' } }))

            // Find closest core node for the Edge PoP
            let closestCore: any = null
            let minDistance = Infinity
            coreNodes.forEach(core => {
                const dist = haversineDist(route.node.lat, route.node.lng, core.lat, core.lng)
                if (dist < minDistance) {
                    minDistance = dist
                    closestCore = core
                }
            })

            if (closestCore) {
                const corePoint = turf.point([closestCore.lng, closestCore.lat])
                features.push(greatCircle(edge, corePoint, { properties: { id: route.id + '-core', type: 'edge-to-core' } }))
            }
        })

        return features
    }, [routes, hoveredUserId, tick, nodes])

    const geojsonRoutes: any = {
        type: 'FeatureCollection',
        features: routeFeatures
    }

    const renderNodeMarker = (node: Node) => {
        const isSelected = selectedNode?.id === node.id
        const isCore = node.type === 'core'

        return (
            <Marker
                key={node.id}
                longitude={node.lng}
                latitude={node.lat}
                anchor="center"
                onClick={e => {
                    e.originalEvent.stopPropagation()
                    setSelectedNode(node)
                }}
            >
                <div className={`relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${isSelected ? 'scale-125 z-50' : 'z-10'}`}>
                    <div className={`absolute w-10 h-10 rounded-full animate-ping opacity-20 ${isCore ? 'bg-fuchsia-500' : 'bg-indigo-500'}`} />
                    <div className={`w-6 h-6 border-2 border-zinc-900 rounded-lg shadow-xl flex items-center justify-center 
                        ${isCore ? 'bg-fuchsia-600 shadow-fuchsia-500/50' : 'bg-indigo-600 shadow-indigo-500/50'}
                        ${isSelected ? 'ring-4 ring-white/20' : ''}
                    `}>
                        {isCore ? <Database size={14} className="text-white" /> : <Server size={14} className="text-white" />}
                    </div>
                    {isSelected && (
                        <div className="absolute top-8 whitespace-nowrap bg-zinc-900 text-xs font-bold px-2 py-1 border border-zinc-700 rounded shadow-2xl">
                            {node.name}
                        </div>
                    )}
                </div>
            </Marker>
        )
    }

    return (
        <div className="w-screen h-screen flex relative overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
            {/* Sidebar Controls */}
            <div className="absolute top-4 left-4 z-10 w-80 flex flex-col gap-4">
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${wsStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                            <Network size={24} className={wsStatus === 'connected' ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Global Router</h1>
                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                                {wsStatus === 'connected' ? '● Live Simulation' : '○ Offline'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setSelectedNode(null)
                                setMode('user')
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${mode === 'user' ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400 scale-105 shadow-[0_0_20px_theme(colors.amber.500/0.2)]' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'}`}
                        >
                            <Zap size={16} /> Drop User
                        </button>

                        <button
                            onClick={() => {
                                if (nodes.length > 0 && users.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                                    const edgeNodes = nodes.filter(n => n.type === 'edge')
                                    users.forEach(u => {
                                        wsRef.current?.send(JSON.stringify({
                                            type: 'SIMULATE_TRAFFIC',
                                            nodes: edgeNodes, // Send only edge nodes to backend to decide
                                            user: u
                                        }))
                                    })
                                }
                            }}
                            disabled={nodes.length === 0 || users.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-900/20"
                        >
                            <Activity size={16} /> Ping All Users
                        </button>

                        <button
                            onClick={handleClear}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                            <Trash2 size={16} /> Clear Traffic
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-4 text-sm text-zinc-400 shadow-xl border-t-zinc-700">
                    <div className="flex justify-between items-center mb-2">
                        <span>Core Centers</span>
                        <span className="text-fuchsia-400 font-bold">{nodes.filter(n => n.type === 'core').length}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span>Edge PoPs</span>
                        <span className="text-indigo-400 font-bold">{nodes.filter(n => n.type === 'edge').length}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span>Simulated Users</span>
                        <span className="text-amber-400 font-bold">{users.length}</span>
                    </div>
                </div>
            </div>

            {mode === 'user' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 backdrop-blur border border-amber-500/50 px-8 py-3 rounded-full shadow-[0_0_30px_theme(colors.amber.500/0.2)] text-amber-500 text-sm font-bold flex items-center gap-3 animate-bounce pointer-events-none">
                    <Zap size={18} /> Click anywhere on the map to drop a Simulated User
                </div>
            )}

            {/* Main Map */}
            <div className={`flex-1 w-full h-full ${mode !== 'idle' ? 'cursor-crosshair' : 'cursor-grab'}`}>
                <Map
                    initialViewState={{
                        longitude: -95,
                        latitude: 38,
                        zoom: 3.5 // Start zoomed in closer on North America
                    }}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    projection={{ name: 'globe' }}
                    style={{ width: '100%', height: '100%' }}
                    onClick={handleMapClick}
                    interactiveLayerIds={['water']}
                >
                    <NavigationControl position="bottom-right" />

                    <Source id="routes" type="geojson" data={geojsonRoutes}>
                        <Layer
                            id="route-lines"
                            type="line"
                            source="routes"
                            filter={['!=', ['get', 'type'], 'edge-to-core']}
                            layout={{
                                'line-cap': 'round',
                                'line-join': 'round'
                            }}
                            paint={{
                                'line-color': '#22d3ee', // cyan-400
                                'line-width': 2.5,
                                'line-opacity': 0.7,
                            }}
                        />
                        <Layer
                            id="route-lines-core"
                            type="line"
                            source="routes"
                            filter={['==', ['get', 'type'], 'edge-to-core']}
                            layout={{
                                'line-cap': 'round',
                                'line-join': 'round'
                            }}
                            paint={{
                                'line-color': '#d946ef', // fuchsia-500
                                'line-width': 2.5,
                                'line-opacity': 0.7,
                                'line-dasharray': [2, 2] // Dotted pattern
                            }}
                        />
                    </Source>

                    {nodes.map(renderNodeMarker)}

                    {users.map(user => (
                        <Marker key={user.id} longitude={user.lng} latitude={user.lat} anchor="bottom">
                            <div
                                className="w-4 h-4 bg-amber-400 border-2 border-zinc-900 rounded-full shadow-[0_0_15px_theme(colors.amber.400/0.6)] cursor-pointer transition-transform hover:scale-125"
                                onMouseEnter={() => setHoveredUserId(user.id)}
                                onMouseLeave={() => setHoveredUserId(null)}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveUserId(user.id)
                                }}
                            />
                        </Marker>
                    ))}

                    {activeUserId && users.find(u => u.id === activeUserId) && (() => {
                        const activeUser = users.find(u => u.id === activeUserId)!
                        return (
                            <Popup
                                longitude={activeUser.lng}
                                latitude={activeUser.lat}
                                anchor="bottom"
                                onClose={() => setActiveUserId(null)}
                                closeButton={false}
                                offset={14}
                                className="z-50"
                            >
                                <div className="bg-zinc-900 border border-red-500/30 rounded-lg shadow-2xl p-1">
                                    <button
                                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-colors shadow-lg shadow-red-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setUsers(prev => prev.filter(u => u.id !== activeUser.id))
                                            setActiveUserId(null)
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </Popup>
                        )
                    })()}
                </Map>
            </div>

            {/* Sliding Panel overlay */}
            <LocalMetroPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
            />
        </div>
    )
}

export default App
