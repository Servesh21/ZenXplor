"""
main.py — entry point for the ZenXplor Windows background agent.

Start-up sequence
─────────────────
1.  Configure logging to the log file FIRST so all errors are captured.
2.  Enforce single-instance via a loopback socket lock.
3.  Hide the console window ONLY when running as a packaged .exe and
    --debug flag is NOT present (keeps console visible during dev).
4.  Ensure %APPDATA%\\ZenXplor\\ exists.
5.  Initialise the database stub (no-op for cloud-only mode).
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

from .config import get_roots, is_registered, mark_registered
from .constants import APP_DATA_DIR, LOG_PATH, PORT, RESCAN_INTERVAL_HOURS
from .indexer import full_scan, init_db
from .server import run_server
from .watcher import start_watchers


# ─── Logging setup ────────────────────────────────────────────────────────────
# MUST run before anything else — especially before FreeConsole — so that
# the file handler is bound to the real file descriptor, not /dev/null.

def _setup_logging() -> None:
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    file_handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    file_handler.setFormatter(fmt)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)

    # Use sys.__stdout__ (the real stdout before any redirect) so the stream
    # handler keeps working even if sys.stdout is later redirected to devnull.
    stream_handler = logging.StreamHandler(sys.__stdout__)
    stream_handler.setFormatter(fmt)
    root_logger.addHandler(stream_handler)


logger = logging.getLogger(__name__)


# ─── Console hide (packaged .exe only) ───────────────────────────────────────

def _hide_console_if_packaged() -> None:
    """Detach from the Windows console window.

    Only runs when:
    - We are on Windows, AND
    - The process is a PyInstaller bundle (sys.frozen is set), AND
    - --debug flag was NOT passed on the command line.

    During development (running via ``python run.py``) the console stays
    visible so you can read live log output.
    """
    debug_mode = "--debug" in sys.argv
    is_frozen = getattr(sys, "frozen", False)

    if sys.platform == "win32" and is_frozen and not debug_mode:
        import ctypes
        ctypes.windll.kernel32.FreeConsole()
        # Redirect to devnull only AFTER logging handlers are already attached
        # to sys.__stdout__ (the real FD), so file logging continues to work.
        sys.stdout = open(os.devnull, "w")
        sys.stderr = open(os.devnull, "w")


# ─── Single-instance lock ─────────────────────────────────────────────────────

def _acquire_instance_lock() -> socket.socket:
    """Try to bind a socket to the agent port to enforce single-instance.

    Raises SystemExit if another instance is already running.
    Returns the bound socket (caller must keep a reference to prevent GC).
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 0)
    try:
        sock.bind(("127.0.0.1", PORT + 1))
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
    # 1. App data directory + logging — MUST be first so all errors are logged.
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    _setup_logging()
    logger.info("ZenXplor agent starting up…")

    # 2. Hide console (only when running as a packaged exe, not in dev mode).
    _hide_console_if_packaged()

    # 3. Single-instance lock — keep the socket alive for the process lifetime.
    _lock_socket = _acquire_instance_lock()  # noqa: F841

    # 4. Database initialisation (no-op for cloud-only mode).
    init_db()

    # 5. Initial full scan in background.
    scan_thread = threading.Thread(target=full_scan, daemon=True, name="full-scan-initial")
    scan_thread.start()

    # 6. Real-time watchers.
    roots = get_roots()
    start_watchers(roots)

    # 7. Periodic re-scan scheduler.
    sched_thread = threading.Thread(target=_run_scheduler, daemon=True, name="scheduler")
    sched_thread.start()

    # 8. Windows startup registration (first run only).
    if not is_registered():
        _register_startup()
        mark_registered()

    # 9. Start Flask server — this call blocks until the process exits.
    run_server()


if __name__ == "__main__":
    main()
