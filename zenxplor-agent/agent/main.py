"""
main.py — entry point for the ZenXplor Windows background agent.

Start-up sequence
─────────────────
1.  Enforce single-instance via a loopback socket lock.
2.  Hide the console window (no black terminal on Windows).
3.  Ensure %APPDATA%\\ZenXplor\\ exists.
4.  Configure logging to both the log file and stdout.
5.  Initialise the SQLite database.
6.  Run full_scan() in a background daemon thread.
7.  Start real-time file watchers.
8.  Schedule a periodic full re-scan every RESCAN_INTERVAL_HOURS hours.
9.  Register the agent for Windows startup (first run only).
10. Start the Flask HTTP server (blocking — last call in the function).
"""

import logging
import os
import schedule
import socket
import sys
import threading
import time

# ─── Hide console on Windows ──────────────────────────────────────────────────
if sys.platform == "win32":
    import ctypes
    ctypes.windll.kernel32.FreeConsole()

from config import get_roots, is_registered, mark_registered
from constants import APP_DATA_DIR, LOG_PATH, PORT, RESCAN_INTERVAL_HOURS
from indexer import full_scan, init_db
from server import run_server
from watcher import start_watchers


# ─── Logging setup ────────────────────────────────────────────────────────────

def _setup_logging() -> None:
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    file_handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    file_handler.setFormatter(fmt)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(fmt)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(stream_handler)


logger = logging.getLogger(__name__)


# ─── Single-instance lock ─────────────────────────────────────────────────────

def _acquire_instance_lock() -> socket.socket:
    """Try to bind a socket to the agent port to enforce single-instance.

    Raises SystemExit if another instance is already running.
    Returns the bound socket (caller must keep a reference to prevent GC).
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 0)
    try:
        sock.bind(("127.0.0.1", PORT))
    except OSError:
        # Port already in use — another instance is running.
        print("ZenXplor agent is already running.", flush=True)
        sys.exit(0)
    return sock


# ─── Windows startup registration ────────────────────────────────────────────

def _register_startup() -> None:
    """Add a Run registry key so the agent starts with Windows."""
    if sys.platform != "win32":
        return
    try:
        import winreg  # stdlib on Windows only

        exe_path = sys.executable
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE
        ) as key:
            winreg.SetValueEx(key, "ZenXplor", 0, winreg.REG_SZ, f'"{exe_path}"')
        logger.info("Registered for Windows startup: %s", exe_path)
    except Exception as exc:
        logger.warning("Could not register startup key: %s", exc)


# ─── Periodic scheduler ───────────────────────────────────────────────────────

def _run_scheduler() -> None:
    """Run the schedule loop in a background daemon thread."""
    schedule.every(RESCAN_INTERVAL_HOURS).hours.do(full_scan)
    while True:
        schedule.run_pending()
        time.sleep(60)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    # 1. Single-instance lock — keep the socket alive for the process lifetime.
    _lock_socket = _acquire_instance_lock()  # noqa: F841

    # 2. App data directory + logging.
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    _setup_logging()
    logger.info("ZenXplor agent starting up…")

    # 3. Database.
    init_db()

    # 4. Initial full scan in background.
    scan_thread = threading.Thread(target=full_scan, daemon=True, name="full-scan-initial")
    scan_thread.start()

    # 5. Real-time watchers.
    roots = get_roots()
    start_watchers(roots)

    # 6. Periodic re-scan scheduler.
    sched_thread = threading.Thread(target=_run_scheduler, daemon=True, name="scheduler")
    sched_thread.start()

    # 7. Windows startup registration (first run only).
    if not is_registered():
        _register_startup()
        mark_registered()

    # 8. Start Flask server — this call blocks until the process exits.
    run_server()


if __name__ == "__main__":
    main()
