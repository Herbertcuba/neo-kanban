#!/usr/bin/env python3
"""Neo Kanban daemon supervisor.

Starts backend/frontend in a *detached* way (start_new_session=True) so they
survive when the parent shell/agent process exits.

Usage:
  ./daemon.py start
  ./daemon.py stop
  ./daemon.py status

Ports:
  frontend: 3000
  backend:  3001
  ws:       3002 (same process as backend)
"""

import os
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOG_DIR = Path.home() / "Library/Logs/neo-kanban"
LOG_DIR.mkdir(parents=True, exist_ok=True)

PID_FRONT = LOG_DIR / "frontend.pid"
PID_BACK = LOG_DIR / "backend.pid"


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except Exception:
        return False


def _read_pid(path: Path):
    try:
        pid = int(path.read_text().strip())
        return pid
    except Exception:
        return None


def _kill_pid(pid: int, sig=signal.SIGKILL):
    try:
        os.kill(pid, sig)
    except Exception:
        pass


def status():
    fpid = _read_pid(PID_FRONT)
    bpid = _read_pid(PID_BACK)
    return {
        "frontend": fpid if fpid and _pid_alive(fpid) else None,
        "backend": bpid if bpid and _pid_alive(bpid) else None,
    }


def stop():
    st = status()
    if st["frontend"]:
        _kill_pid(st["frontend"], signal.SIGKILL)
    if st["backend"]:
        _kill_pid(st["backend"], signal.SIGKILL)

    # best-effort cleanup
    for p in (PID_FRONT, PID_BACK):
        try:
            p.unlink()
        except Exception:
            pass


def start():
    # install deps if missing
    if not (ROOT / "backend/node_modules").exists() or not (ROOT / "frontend/node_modules").exists():
        subprocess.check_call(["npm", "install", "--silent"], cwd=str(ROOT / "backend"))
        subprocess.check_call(["npm", "install", "--silent"], cwd=str(ROOT / "frontend"))

    # backend
    bout = open(LOG_DIR / "backend.log", "a")
    bproc = subprocess.Popen(
        ["npm", "start"],
        cwd=str(ROOT / "backend"),
        stdout=bout,
        stderr=bout,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
        env={**os.environ},
    )
    PID_BACK.write_text(str(bproc.pid))

    # frontend
    fout = open(LOG_DIR / "frontend.log", "a")
    env = {**os.environ, "BROWSER": "none"}
    fproc = subprocess.Popen(
        ["npm", "start"],
        cwd=str(ROOT / "frontend"),
        stdout=fout,
        stderr=fout,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
        env=env,
    )
    PID_FRONT.write_text(str(fproc.pid))


def main():
    if len(sys.argv) < 2:
        print("usage: daemon.py start|stop|status")
        sys.exit(2)

    cmd = sys.argv[1]
    if cmd == "status":
        st = status()
        print(f"frontend_pid={st['frontend']} backend_pid={st['backend']}")
        sys.exit(0)

    if cmd == "stop":
        stop()
        print("stopped")
        sys.exit(0)

    if cmd == "start":
        # if already running, do nothing
        st = status()
        if st["frontend"] and st["backend"]:
            print("already_running")
            sys.exit(0)

        # stop any stale
        stop()
        start()
        print("started")
        sys.exit(0)

    print("unknown command")
    sys.exit(2)


if __name__ == "__main__":
    main()
