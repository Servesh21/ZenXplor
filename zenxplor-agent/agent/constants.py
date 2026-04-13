"""
constants.py — shared constants for the ZenXplor Windows background agent.
"""

import os

PORT = 7832
APP_NAME = "ZenXplor"
APP_DATA_DIR = os.path.join(os.environ.get("APPDATA", ""), "ZenXplor")
DB_PATH = os.path.join(APP_DATA_DIR, "index.db")
CONFIG_PATH = os.path.join(APP_DATA_DIR, "config.ini")
LOG_PATH = os.path.join(APP_DATA_DIR, "agent.log")

RESCAN_INTERVAL_HOURS = 6

EXCLUDE_DIRS = {
    # Windows system — these will throw PermissionError anyway
    "Windows", "Windows.old", "$Recycle.Bin", "$WINDOWS.~BT",
    "System Volume Information", "PerfLogs", "Recovery",
    "Program Files", "Program Files (x86)", "ProgramData",
    "WindowsApps", "MicrosoftEdgeBackups",
    # Dev artifacts
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "env", ".gradle", ".idea", ".vscode", "dist", "build",
    # macOS (irrelevant on Windows but safe to include)
    ".Trash", ".Spotlight-V100",
}

EXCLUDE_EXTENSIONS = {".tmp", ".sys", ".dll", ".exe", ".lnk", ".ini"}
