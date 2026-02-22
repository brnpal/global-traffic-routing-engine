import { X, Network, Server } from 'lucide-react'
import type { Node } from '../App'

interface LocalMetroPanelProps {
    node: Node | null
    onClose: () => void
}

export function LocalMetroPanel({ node, onClose }: LocalMetroPanelProps) {
    if (!node) return null

    const isCore = node.type === 'core'

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-zinc-900 border-l border-zinc-700 shadow-2xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
            {/* Header */}
            <div className={`p-6 border-b border-zinc-800 ${isCore ? 'bg-fuchsia-950/30' : 'bg-indigo-950/30'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {isCore ? (
                            <div className="p-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg">
                                <Server size={20} />
                            </div>
                        ) : (
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                                <Network size={20} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white">{node.name}</h2>
                            <p className="text-xs text-zinc-400 font-mono">
                                {isCore ? 'Core Origin Data Center' : 'Edge Point of Presence'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Local Metro Visualization */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
                <h3 className="text-sm font-semibold text-zinc-300 mb-10 uppercase tracking-wider">
                    Metro Ring Topology
                </h3>

                <div className="relative">
                    {/* Ingress Router */}
                    <div className="flex justify-center relative z-10 mb-8">
                        <div className={`flex flex-col items-center bg-zinc-900 border-2 p-4 rounded-xl shadow-lg
                            ${isCore ? 'border-fuchsia-500/50 shadow-fuchsia-900/20' : 'border-indigo-500/50 shadow-indigo-900/20'}`}
                        >
                            <Network size={24} className={isCore ? 'text-fuchsia-400 mb-2' : 'text-indigo-400 mb-2'} />
                            <span className="text-sm font-bold text-white text-center">Ingress Edge Router<br /><span className="text-xs text-zinc-500 font-normal">Layer 7 Proxy</span></span>

                            {/* Animated incoming traffic pulse */}
                            <div className="absolute -top-6 w-3 h-3 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_#22d3ee]" />
                        </div>
                    </div>

                    {/* SVG Connecting Lines with Animations */}
                    <svg className="absolute top-16 left-0 w-full h-32 z-0" style={{ pointerEvents: 'none' }}>
                        <defs>
                            <linearGradient id={`${node.id}-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                                <stop offset="100%" stopColor={isCore ? '#d946ef' : '#6366f1'} stopOpacity="0.8" />
                            </linearGradient>

                            {/* Animated traffic dots along the paths */}
                            <path id="pathLeft" d="M 170 10 Q 60 50, 60 90" fill="none" />
                            <path id="pathCenter" d="M 170 10 L 170 90" fill="none" />
                            <path id="pathRight" d="M 170 10 Q 280 50, 280 90" fill="none" />
                        </defs>

                        {/* Base structural lines */}
                        <path d="M 170 10 Q 60 50, 60 90" stroke="#3f3f46" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                        <path d="M 170 10 L 170 90" stroke="#3f3f46" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                        <path d="M 170 10 Q 280 50, 280 90" stroke="#3f3f46" strokeWidth="2" fill="none" strokeDasharray="4 4" />

                        {/* Flowing animated traffic lines */}
                        <path
                            d="M 170 10 Q 60 50, 60 90"
                            stroke={`url(#${node.id}-gradient)`}
                            strokeWidth="3"
                            fill="none"
                            className="animate-[dash_2s_linear_infinite]"
                            style={{ strokeDasharray: '15 15' }}
                        />
                        <path
                            d="M 170 10 L 170 90"
                            stroke={`url(#${node.id}-gradient)`}
                            strokeWidth="3"
                            fill="none"
                            className="animate-[dash_1.5s_linear_infinite]"
                            style={{ strokeDasharray: '15 15' }}
                        />
                        <path
                            d="M 170 10 Q 280 50, 280 90"
                            stroke={`url(#${node.id}-gradient)`}
                            strokeWidth="3"
                            fill="none"
                            className="animate-[dash_2.5s_linear_infinite]"
                            style={{ strokeDasharray: '15 15' }}
                        />
                    </svg>

                    {/* Data Center Buildings */}
                    <div className="flex justify-between relative z-10 mt-20 px-2">
                        {['DC-01', 'DC-02', 'DC-03'].map((dc, i) => (
                            <div key={dc} className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden group">
                                    {/* Active connection pulse behind icon */}
                                    <div className={`absolute inset-0 opacity-20 animate-pulse ${isCore ? 'bg-fuchsia-500' : 'bg-indigo-500'}`} style={{ animationDelay: `${i * 300}ms` }} />
                                    <Server size={24} className="text-zinc-300 relative z-10 group-hover:text-white transition-colors" />

                                    {/* Simulated server rack lights */}
                                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: `${i * 100}ms` }} />
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: `${i * 200}ms` }} />
                                    </div>
                                </div>
                                <span className="mt-2 text-xs font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                                    {dc}
                                </span>
                                <div className="mt-3 flex flex-col gap-1 w-full text-center">
                                    <span className="text-[10px] text-zinc-300 font-mono tracking-wider bg-zinc-900/80 rounded py-0.5 border border-zinc-800">
                                        CPU: {60 + Math.floor(Math.random() * 10)}% | QPS: {42 + Math.floor(Math.random() * 5)}k
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 rounded py-0.5 mt-1 border border-emerald-500/20">
                                        Weight: 33 (Active)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Telemetry Grid */}
                <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <div className={`px-4 py-2 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between
                        ${isCore ? 'bg-fuchsia-950/20' : 'bg-indigo-950/20'}`}
                    >
                        <span>Live Metro Telemetry</span>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-500 font-mono">SYNCED</span>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">
                                {isCore ? 'Backbone Link' : 'Ingress Protocol'}
                            </span>
                            <span className="text-zinc-200 font-mono">
                                {isCore ? 'Active (AS64500)' : 'Envoy / K8s'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">
                                {isCore ? 'DB Queries/Sec' : 'Cache Hit Ratio'}
                            </span>
                            <span className="text-zinc-200 font-mono text-cyan-400 font-bold">
                                {isCore ? '125k' : '94.2%'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-zinc-500 text-xs uppercase tracking-wider">
                                    {isCore ? 'Core Uplink Capacity' : 'Metro Fiber Capacity'}
                                </span>
                                <span className="text-zinc-400 font-mono text-xs">
                                    {isCore ? '85 Gbps / 100 Gbps' : '1.2 Tbps / 4.0 Tbps'}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isCore ? 'bg-fuchsia-500' : 'bg-indigo-500'}`} style={{ width: isCore ? '85%' : '30%' }}></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">Active Conns</span>
                            <span className="text-zinc-200 font-mono">
                                {isCore ? '8,500' : '1.4M'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-zinc-500 text-xs uppercase tracking-wider">
                                {isCore ? 'Storage IOPS' : 'BGP Route'}
                            </span>
                            <span className={isCore ? "text-zinc-200 font-mono" : "text-emerald-400 font-mono flex items-center gap-1.5"}>
                                {isCore ? '450k' : '🟢 Established'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inject custom CSS keyframes for SVG dash animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes dash {
                    to {
                        stroke-dashoffset: -30;
                    }
                }
            `}} />
        </div>
    )
}
