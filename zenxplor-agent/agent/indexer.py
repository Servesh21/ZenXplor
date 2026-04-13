"""
indexer.py — SQLite-backed filesystem index for the ZenXplor agent.

The full_scan() function is designed to run in a background daemon thread
so it never blocks the Flask HTTP server.
"""

import logging
import os
import sqlite3
import time
from typing import Optional

from .config import get_config, get_roots, set_value
from .constants import DB_PATH, APP_DATA_DIR, EXCLUDE_DIRS, EXCLUDE_EXTENSIONS

logger = logging.getLogger(__name__)

# Global flag so the HTTP server can report whether a scan is in progress.
_scanning: bool = False


def is_scanning() -> bool:
    return _scanning


# ─── Database helpers ─────────────────────────────────────────────────────────

def get_db_connection() -> sqlite3.Connection:
    """Return a sqlite3 connection to DB_PATH with dict-like Row access."""
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the files table and indexes if they do not yet exist."""
    with get_db_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS files (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                filepath     TEXT UNIQUE NOT NULL,
                filename     TEXT NOT NULL,
                filetype     TEXT,
                filesize     INTEGER,
                last_modified REAL,
                is_folder    INTEGER DEFAULT 0,
                indexed_at   REAL
            );
            CREATE INDEX IF NOT EXISTS idx_filename ON files(filename);
            CREATE INDEX IF NOT EXISTS idx_filepath ON files(filepath);
        """)
    logger.info("Database initialised at %s", DB_PATH)


# ─── Record helpers ───────────────────────────────────────────────────────────

def upsert_file(
    filepath: str,
    filename: str,
    filetype: Optional[str],
    filesize: Optional[int],
    last_modified: Optional[float],
    is_folder: bool = False,
) -> None:
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO files
                (filepath, filename, filetype, filesize, last_modified, is_folder, indexed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                filepath,
                filename,
                filetype,
                filesize,
                last_modified,
                1 if is_folder else 0,
                time.time(),
            ),
        )


def delete_file(filepath: str) -> None:
    with get_db_connection() as conn:
        conn.execute("DELETE FROM files WHERE filepath = ?", (filepath,))


# ─── Search ───────────────────────────────────────────────────────────────────

def search_files(
    query: str,
    limit: int = 50,
    offset: int = 0,
    filetype: Optional[str] = None,
) -> list[dict]:
    with get_db_connection() as conn:
        if filetype:
            rows = conn.execute(
                """
                SELECT * FROM files
                WHERE filename LIKE '%' || ? || '%'
                  AND filetype = ?
                ORDER BY last_modified DESC
                LIMIT ? OFFSET ?
                """,
                (query, filetype, limit, offset),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM files
                WHERE filename LIKE '%' || ? || '%'
                ORDER BY last_modified DESC
                LIMIT ? OFFSET ?
                """,
                (query, limit, offset),
            ).fetchall()
    return [dict(row) for row in rows]


# ─── Stats ────────────────────────────────────────────────────────────────────

def get_stats() -> dict:
    with get_db_connection() as conn:
        total_files = conn.execute(
            "SELECT COUNT(*) FROM files WHERE is_folder = 0"
        ).fetchone()[0]
        total_folders = conn.execute(
            "SELECT COUNT(*) FROM files WHERE is_folder = 1"
        ).fetchone()[0]

    db_size_mb = 0.0
    if os.path.exists(DB_PATH):
        db_size_mb = round(os.path.getsize(DB_PATH) / (1024 * 1024), 2)

    cfg = get_config()
    last_scan = cfg.get("indexing", "last_full_scan", fallback="")

    return {
        "total_files": total_files,
        "total_folders": total_folders,
        "db_size_mb": db_size_mb,
        "last_scan": last_scan,
    }


# ─── Full filesystem scan ─────────────────────────────────────────────────────

def _should_exclude_path(path: str) -> bool:
    """Return True if any component of path is in EXCLUDE_DIRS."""
    parts = path.replace("\\", "/").split("/")
    return any(part in EXCLUDE_DIRS for part in parts)


def full_scan(roots: Optional[list[str]] = None) -> int:
    """Walk every root path and upsert all files into SQLite.

    Runs in a background daemon thread — never blocks the HTTP server.
    Returns the total count of files processed.
    """
    global _scanning
    if _scanning:
        logger.info("full_scan called but a scan is already running — skipping.")
        return 0

    _scanning = True
    if roots is None:
        roots = get_roots()

    logger.info("full_scan starting. roots=%s", roots)
    total = 0

    try:
        for root in roots:
            if not os.path.isdir(root):
                logger.warning("Root path does not exist, skipping: %s", root)
                continue

            for dirpath, dirnames, filenames in os.walk(root, topdown=True, onerror=None):
                # Prune excluded directories in-place so os.walk doesn't descend into them.
                dirnames[:] = [
                    d for d in dirnames
                    if d not in EXCLUDE_DIRS and not os.path.islink(os.path.join(dirpath, d))
                ]

                for fname in filenames:
                    filepath = os.path.join(dirpath, fname)

                    if os.path.islink(filepath):
                        continue

                    ext = os.path.splitext(fname)[1].lower()
                    if ext in EXCLUDE_EXTENSIONS:
                        continue

                    try:
                        filesize = os.path.getsize(filepath)
                    except OSError:
                        filesize = None

                    try:
                        mtime = os.path.getmtime(filepath)
                    except OSError:
                        mtime = None

                    try:
                        upsert_file(
                            filepath=filepath,
                            filename=fname,
                            filetype=ext.lstrip(".") if ext else None,
                            filesize=filesize,
                            last_modified=mtime,
                        )
                    except PermissionError:
                        logger.debug("Permission denied: %s", filepath)
                        continue
                    except Exception as exc:
                        logger.debug("Skipping %s: %s", filepath, exc)
                        continue

                    total += 1
                    if total % 10_000 == 0:
                        logger.info("Indexed %d files so far…", total)

        now = time.strftime("%Y-%m-%d %H:%M:%S")
        set_value("indexing", "last_full_scan", now)
        logger.info("full_scan complete. Total files indexed: %d", total)
    finally:
        _scanning = False

    return total
