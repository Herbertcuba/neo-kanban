#!/bin/bash

# Neo Kanban App Startup Script
echo "🚀 Starting Neo & Herbert Kanban App..."

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the kanban-app directory"
    exit 1
fi

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js first:"
        echo "   brew install node"
        exit 1
    fi
    echo "✅ Node.js found: $(node --version)"
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install --silent
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
    
    echo "📦 Installing frontend dependencies..."
    cd ../frontend
    npm install --silent
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
    
    cd ..
    echo "✅ Dependencies installed successfully"
}

# Function to start the servers
start_servers() {
    echo "🖥️ Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    echo "⚛️ Starting React frontend..."
    cd ../frontend
    BROWSER=none npm start &
    FRONTEND_PID=$!
    
    cd ..
    
    echo "✅ Servers started!"
    echo "📊 Backend API: http://localhost:3001"
    echo "🌐 Frontend UI: http://localhost:3000"
    echo "🔌 WebSocket: ws://localhost:3002"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    
    # Wait for Ctrl+C
    trap 'kill $BACKEND_PID $FRONTEND_PID; echo "🛑 Servers stopped"; exit 0' INT
    wait
}

# Main execution
check_node

# Check if node_modules exist
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    install_deps
else
    echo "📦 Dependencies already installed"
fi

start_servers