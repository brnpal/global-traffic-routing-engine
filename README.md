in bash,

download the code to their local machine:

git clone https://github.com/brnpal/global-traffic-routing-engine.git
cd global-traffic-routing-engine

create their own Python environment and install the required packages:

# Navigate to the API folder
cd api

# Create a new virtual environment
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate  # On Windows, they would use: .venv\Scripts\activate

# Install the required Python packages (FastAPI, Uvicorn, and Websockets)
pip install fastapi uvicorn websockets

# Start the backend server on port 8000
uvicorn main:app --reload

In a separate terminal, they will need to install the Node.js dependencies and provide their own Mapbox token

# Navigate to the Web folder
cd web

# Install all Node.js dependencies (React, Mapbox, Tailwind, etc.)
npm install

# Create their own environment file
touch .env.local

in env, 

VITE_MAPBOX_TOKEN=their_own_mapbox_token_here

Finally, start the frontend development server, in bash:

npm run dev

open the localhost link provided by Vite.


