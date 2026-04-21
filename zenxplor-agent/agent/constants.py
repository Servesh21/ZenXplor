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

# Maximum file size to index (50 MB) — skips huge media/archive files
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

# ── Allowlist approach ────────────────────────────────────────────────────────
# Only index extensions that are actually useful in day-to-day work.
# Everything else (system files, compiled binaries, temp files, caches) is
# silently skipped.  This dramatically reduces index size and scan time.

ALLOWED_EXTENSIONS: set[str] = {
    # ── Documents ──────────────────────────────────────────────────────────
    ".pdf",
    ".docx", ".doc", ".odt", ".rtf",
    ".xlsx", ".xls", ".xlsm", ".ods", ".csv", ".tsv",
    ".pptx", ".ppt", ".odp",
    ".pages", ".numbers", ".key",          # Apple iWork (rare on Windows but safe)

    # ── Plain text / markdown ──────────────────────────────────────────────
    ".txt", ".md", ".markdown", ".rst", ".log",

    # ── Programming & config ───────────────────────────────────────────────
    ".py", ".ipynb",
    ".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte",
    ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".json", ".yaml", ".yml", ".toml", ".xml",
    ".sql", ".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd",
    ".java", ".kt", ".scala",
    ".cpp", ".c", ".h", ".hpp", ".cc",
    ".cs", ".vb",
    ".go", ".rs",
    ".rb", ".php", ".swift", ".dart",
    ".r", ".m",                            # R and MATLAB
    ".lua",
    ".env", ".gitignore", ".dockerignore",
    ".makefile", ".mk",
    ".gradle", ".pom",

    # ── Images (common formats used in work, not huge raw files) ──────────
    ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
    ".bmp", ".tiff", ".tif",

    # ── Audio / Video (capped by MAX_FILE_SIZE_BYTES) ─────────────────────
    ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a",
    ".mp4", ".mov", ".avi", ".mkv", ".webm",

    # ── Archives ───────────────────────────────────────────────────────────
    ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz",

    # ── Data ───────────────────────────────────────────────────────────────
    ".db", ".sqlite", ".sqlite3",
    ".parquet", ".feather",

    # ── E-mail ─────────────────────────────────────────────────────────────
    ".eml", ".msg",

    # ── Fonts (sometimes needed) ────────────────────────────────────────────
    ".ttf", ".otf", ".woff", ".woff2",
}

# Directories that are never descended into regardless of extension.
EXCLUDE_DIRS: set[str] = {
    # Windows system
    "Windows", "Windows.old", "$Recycle.Bin", "$WINDOWS.~BT",
    "System Volume Information", "PerfLogs", "Recovery",
    "Program Files", "Program Files (x86)", "ProgramData",
    "WindowsApps", "MicrosoftEdgeBackups",
    # Dev artefacts / caches
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "env", ".gradle", ".idea", ".vscode", "dist", "build",
    ".cache", ".npm", ".yarn", ".pnp",
    # macOS (irrelevant on Windows but harmless)
    ".Trash", ".Spotlight-V100",
    # Large well-known media / game directories
    "AppData",                             # user app data — too much noise
}
