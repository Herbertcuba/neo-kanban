#!/bin/bash
set -euo pipefail

# Watchdog: ensure kanban backend/frontend are up; restart if not.

cd "$(dirname "$0")"

FRONT_OK=0
BACK_OK=0

# Use LISTEN checks instead of HTTP status codes (backend may return 404 on /)
if /usr/sbin/lsof -tiTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  FRONT_OK=1
fi

if /usr/sbin/lsof -tiTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
  BACK_OK=1
fi

if [ $FRONT_OK -eq 1 ] && [ $BACK_OK -eq 1 ]; then
  echo "✅ Kanban OK (ports listening)"
  exit 0
fi

echo "⚠️ Kanban unhealthy (front=$FRONT_OK back=$BACK_OK). Restarting…"

# Use the Python supervisor (properly detached processes)
/usr/bin/python3 "$(dirname "$0")/daemon.py" start
