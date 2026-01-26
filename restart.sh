#!/bin/bash

# Neo Kanban App Restart Script (after rebuild)
echo "🔄 Restarting Neo Kanban App after rebuild..."

# Kill existing processes
echo "🛑 Stopping existing servers..."
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Start the app
echo "🚀 Starting app..."
./start.sh