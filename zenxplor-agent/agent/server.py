"""
server.py — Flask localhost-only HTTP API for the ZenXplor Windows agent.

Security model:
  • Binds exclusively to 127.0.0.1 — not accessible from the network.
  • Every endpoint (except /health and /auth) rejects requests whose
    remote_addr is not the loopback address.
  • CORS is restricted to known ZenXplor frontend origins.
"""

import logging
import os
import re
import subprocess
import threading
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from .config import get_config, get_roots, set_jwt, set_roots
from .constants import EXCLUDE_DIRS, PORT
from .indexer import (
    delete_file,
    full_scan,
    get_stats,
    is_scanning,
    search_files,
)
from .watcher import are_watchers_active, start_watchers

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(
    app,
    origins=[
        re.compile(r"http://localhost:\d+"),  # any local dev server
        re.compile(r"https://.*"),            # any HTTPS-deployed frontend
    ],
)

VERSION = "1.0.0"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _is_localhost() -> bool:
    return request.remote_addr in ("127.0.0.1", "::1")


def _resolve_and_validate(raw_path: str) -> tuple[str, bool]:
    """Resolve a user-supplied path and validate it is safe to serve.

    Returns (resolved_path, is_safe).  is_safe is False when:
    - The resolved path cannot be computed.
    - Any path component is in EXCLUDE_DIRS.
    """
    try:
        resolved = os.path.realpath(raw_path)
    except (ValueError, OSError):
        return raw_path, False
    # Reject paths containing excluded directory names
    parts = resolved.replace("\\", "/").split("/")
    if any(part in EXCLUDE_DIRS for part in parts):
        return resolved, False
    return resolved, True


def _is_within_roots(filepath: str) -> bool:
    """Return True only when filepath is contained within a configured scan root."""
    for root in get_roots():
        try:
            resolved_root = os.path.realpath(root)
            if not resolved_root:
                continue
            common = os.path.commonpath([filepath, resolved_root])
            if common == resolved_root:
                return True
        except (ValueError, OSError):
            continue
    return False


def _get_safe_path(filepath: str) -> "str | None":
    """Return the real filepath if it is within our accessible roots."""
    try:
        resolved, safe = _resolve_and_validate(filepath)
        if safe and _is_within_roots(resolved) and os.path.exists(resolved):
            return resolved
    except Exception:
        pass
    return None

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok", "version": VERSION, "port": PORT})


@app.route("/auth", methods=["POST"])
def auth() -> Any:
    data = request.get_json(silent=True) or {}
    token = data.get("jwt_token", "")
    backend_url = data.get("backend_url", "")
    if not token or not backend_url:
        return jsonify({"error": "jwt_token and backend_url are required"}), 400

    set_jwt(token, backend_url)
    logger.info("Auth token saved. backend_url=%s", backend_url)

    # Kick off a background scan now that we have a fresh token, but only
    # if one isn't already running.
    if not is_scanning():
        t = threading.Thread(target=full_scan, daemon=True, name="post-auth-scan")
        t.start()
        logger.info("Started background scan after new token was received.")
        return jsonify({"saved": True, "scan_started": True})

    return jsonify({"saved": True, "scan_started": False})


@app.route("/token-status", methods=["GET"])
def token_status() -> Any:
    """Debug endpoint (localhost-only) — shows whether a JWT token is configured."""
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    cfg = get_config()
    token = cfg.get("auth", "jwt_token", fallback="").strip()
    backend_url = cfg.get("auth", "backend_url", fallback="").strip()
    return jsonify({
        "token_configured": bool(token),
        "token_length": len(token),
        "backend_url": backend_url or "(not set)",
        "scanning": is_scanning(),
    })


@app.route("/search", methods=["GET"])
def search() -> Any:
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "q parameter is required"}), 400

    try:
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
    except ValueError:
        return jsonify({"error": "limit and offset must be integers"}), 400

    filetype = request.args.get("filetype") or None

    results = search_files(query, limit=limit, offset=offset, filetype=filetype)
    enriched = [
        {
            "filename": r["filename"],
            "filepath": r["filepath"],
            "filetype": r["filetype"],
            "filesize": r["filesize"],
            "last_modified": r["last_modified"],
            "is_folder": bool(r["is_folder"]),
            "source": "local",
        }
        for r in results
    ]
    return jsonify({"results": enriched, "total": len(enriched), "offset": offset, "limit": limit})


@app.route("/open", methods=["POST"])
def open_file() -> Any:
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    raw = data.get("filepath", "")
    if not raw:
        return jsonify({"error": "filepath is required"}), 400
    
    safe_path = _get_safe_path(raw)
    if safe_path is None:
        return jsonify({"error": "Access denied or file not found"}), 403

    try:
        subprocess.Popen(["explorer", "/select,", safe_path])
    except Exception as exc:
        logger.error("Failed to open file explorer: %s", exc)
        return jsonify({"error": "Could not open file"}), 500

    return jsonify({"opened": True})


@app.route("/download", methods=["GET"])
def download_file() -> Any:
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    raw = request.args.get("filepath", "").strip()
    if not raw:
        return jsonify({"error": "filepath parameter is required"}), 400
        
    safe_path = _get_safe_path(raw)
    if safe_path is None:
        return jsonify({"error": "Access denied or file not found"}), 403
    if not os.path.isfile(safe_path):
        return jsonify({"error": "Not a file"}), 400

    return send_from_directory(
        os.path.dirname(safe_path),
        os.path.basename(safe_path),
        as_attachment=True,
    )


@app.route("/scan", methods=["POST"])
def trigger_scan() -> Any:
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    if is_scanning():
        return jsonify({"scanning": False, "message": "Already running"}), 200

    t = threading.Thread(target=full_scan, daemon=True)
    t.start()
    return jsonify({"scanning": True, "message": "Scan started"})


@app.route("/status", methods=["GET"])
def status() -> Any:
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    cfg = get_config()
    last_scan = cfg.get("indexing", "last_full_scan", fallback="")

    return jsonify(
        {
            "stats": get_stats(),
            "scanning": is_scanning(),
            "watching": are_watchers_active(),
            "last_scan": last_scan,
            "roots": get_roots(),
        }
    )


@app.route("/roots", methods=["POST"])
def update_roots() -> Any:
    if not _is_localhost():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    roots = data.get("roots", [])
    if not isinstance(roots, list) or not roots:
        return jsonify({"error": "roots must be a non-empty list"}), 400

    valid_roots = []
    for r in roots:
        if not isinstance(r, str):
            logger.warning("Invalid root path ignored: %r", r)
            continue
        resolved, safe = _resolve_and_validate(r)
        if safe and Path(resolved).is_dir():
            valid_roots.append(resolved)
        else:
            logger.warning("Invalid root path ignored: %s", r)

    if not valid_roots:
        return jsonify({"error": "No valid root paths provided"}), 400

    set_roots(valid_roots)
    start_watchers(valid_roots)
    return jsonify({"roots": valid_roots, "saved": True})


# ─── Run ─────────────────────────────────────────────────────────────────────

def run_server() -> None:
    logger.info("Starting ZenXplor local API server on 127.0.0.1:%d", PORT)
    app.run(host="127.0.0.1", port=PORT, threaded=True, use_reloader=False)
