"""
watcher.py — real-time filesystem monitoring using the watchdog library.

Watches every root path recursively and keeps the SQLite index up-to-date
as files are created, modified, moved, or deleted.
"""

import logging
import os
from typing import Optional

from watchdog.events import FileSystemEventHandler, FileSystemEvent
from watchdog.observers import Observer

from .constants import EXCLUDE_DIRS, EXCLUDE_EXTENSIONS
from .indexer import upsert_file, delete_file

logger = logging.getLogger(__name__)


def _file_meta(filepath: str) -> tuple[Optional[int], Optional[float]]:
    """Return (filesize, mtime) for filepath, silencing OSError."""
    try:
        filesize = os.path.getsize(filepath)
    except OSError:
        filesize = None
    try:
        mtime = os.path.getmtime(filepath)
    except OSError:
        mtime = None
    return filesize, mtime


def _should_skip(path: str) -> bool:
    """Return True if the path contains an excluded directory component."""
    parts = path.replace("\\", "/").split("/")
    return any(part in EXCLUDE_DIRS for part in parts)


class FileChangeHandler(FileSystemEventHandler):
    def on_created(self, event: FileSystemEvent) -> None:
        path = event.src_path
        if _should_skip(path):
            return
        if event.is_directory:
            upsert_file(
                filepath=path,
                filename=os.path.basename(path),
                filetype=None,
                filesize=None,
                last_modified=None,
                is_folder=True,
            )
        else:
            ext = os.path.splitext(path)[1].lower()
            if ext in EXCLUDE_EXTENSIONS:
                return
            filesize, mtime = _file_meta(path)
            upsert_file(
                filepath=path,
                filename=os.path.basename(path),
                filetype=ext.lstrip(".") if ext else None,
                filesize=filesize,
                last_modified=mtime,
            )

    def on_deleted(self, event: FileSystemEvent) -> None:
        if _should_skip(event.src_path):
            return
        delete_file(event.src_path)

    def on_moved(self, event: FileSystemEvent) -> None:
        if not _should_skip(event.src_path):
            delete_file(event.src_path)
        dest = event.dest_path
        if _should_skip(dest):
            return
        if event.is_directory:
            upsert_file(
                filepath=dest,
                filename=os.path.basename(dest),
                filetype=None,
                filesize=None,
                last_modified=None,
                is_folder=True,
            )
        else:
            ext = os.path.splitext(dest)[1].lower()
            if ext in EXCLUDE_EXTENSIONS:
                return
            filesize, mtime = _file_meta(dest)
            upsert_file(
                filepath=dest,
                filename=os.path.basename(dest),
                filetype=ext.lstrip(".") if ext else None,
                filesize=filesize,
                last_modified=mtime,
            )

    def on_modified(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        path = event.src_path
        if _should_skip(path):
            return
        ext = os.path.splitext(path)[1].lower()
        if ext in EXCLUDE_EXTENSIONS:
            return
        filesize, mtime = _file_meta(path)
        upsert_file(
            filepath=path,
            filename=os.path.basename(path),
            filetype=ext.lstrip(".") if ext else None,
            filesize=filesize,
            last_modified=mtime,
        )


# Module-level list so the server can check watcher health.
_observers: list[Observer] = []


def are_watchers_active() -> bool:
    return any(obs.is_alive() for obs in _observers)


def stop_watchers() -> None:
    for obs in _observers:
        try:
            obs.stop()
            obs.join(timeout=5)
        except Exception as exc:
            logger.warning("Error stopping observer: %s", exc)
    _observers.clear()


def start_watchers(roots: list[str]) -> list[Observer]:
    """Start one Observer per root path, watching recursively.

    If a root fails to start (e.g. permission denied on a drive root),
    the error is logged and that root is skipped — remaining roots still
    get watchers.
    """
    global _observers
    stop_watchers()

    handler = FileChangeHandler()
    new_observers: list[Observer] = []

    for root in roots:
        # Resolve and verify path components to guard against traversal
        resolved_root = os.path.realpath(root)
        parts = resolved_root.replace("\\", "/").split("/")
        if any(part in EXCLUDE_DIRS for part in parts):
            logger.warning("Watcher skipped — excluded path: %s", root)
            continue
        # Use pathlib for the existence check so the path object is clearly
        # derived from the validated resolved_root, not raw user input
        from pathlib import Path as _Path  # local import to keep top cleaner
        root_path = _Path(resolved_root)
        if not root_path.is_dir():
            logger.warning("Watcher skipped — path does not exist: %s", root)
            continue
        obs = Observer()
        try:
            obs.schedule(handler, str(root_path), recursive=True)
            obs.start()
            new_observers.append(obs)
            logger.info("Watching: %s", root)
        except Exception as exc:
            logger.warning("Could not start watcher for %s: %s", root, exc)

    _observers = new_observers
    return new_observers
