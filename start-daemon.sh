#!/bin/bash
set -euo pipefail

# Start Neo Kanban app in background (daemon-style). Safe for cron/watchdogs.
# Runs backend on :3001 and frontend on :3000.

cd "$(dirname "$0")"

if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "❌ Error: run from kanban-app directory"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js not found"
  exit 1
fi

echo "🚀 Starting Neo Kanban (daemon)…"

# Install deps if missing
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing dependencies…"
  (cd backend && npm install --silent)
  (cd frontend && npm install --silent)
fi

LOG_DIR="${HOME}/Library/Logs/neo-kanban"
mkdir -p "$LOG_DIR"

# Backend
if /usr/sbin/lsof -tiTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ Backend already listening on :3001"
else
  echo "🖥️ Starting backend…"
  (cd backend && nohup npm start >"$LOG_DIR/backend.log" 2>&1 & echo $! >"$LOG_DIR/backend.pid")
fi

sleep 2

# Frontend
if /usr/sbin/lsof -tiTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ Frontend already listening on :3000"
else
  echo "⚛️ Starting frontend…"
  (cd frontend && nohup env BROWSER=none npm start >"$LOG_DIR/frontend.log" 2>&1 & echo $! >"$LOG_DIR/frontend.pid")
fi

echo "✅ Neo Kanban should be available: http://localhost:3000"
