#!/bin/bash
set -euo pipefail

# Stop Neo Kanban app by killing listeners on ports 3000/3001/3002.

cd "$(dirname "$0")"

echo "🛑 Stopping Neo Kanban…"

# lsof is in /usr/sbin on macOS (not always in PATH)
PIDS="$(/usr/sbin/lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true) $(/usr/sbin/lsof -tiTCP:3001 -sTCP:LISTEN 2>/dev/null || true) $(/usr/sbin/lsof -tiTCP:3002 -sTCP:LISTEN 2>/dev/null || true)"
PIDS="$(echo "$PIDS" | tr ' ' '\n' | sed '/^$/d' | sort -u | tr '\n' ' ')"

if [ -n "${PIDS// }" ]; then
  echo "Killing PIDs: $PIDS"
  kill -9 $PIDS 2>/dev/null || true
else
  echo "Nothing listening on 3000/3001/3002"
fi

echo "✅ Stopped"
