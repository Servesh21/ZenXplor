"""
config.py — reads and writes the ZenXplor agent config.ini stored in
%APPDATA%\\ZenXplor\\config.ini.
"""

import configparser
import os

from .constants import APP_DATA_DIR, CONFIG_PATH


def _ensure_app_dir() -> None:
    os.makedirs(APP_DATA_DIR, exist_ok=True)


def _default_config() -> configparser.ConfigParser:
    cfg = configparser.ConfigParser()
    cfg["auth"] = {
        "jwt_token": "",
        "backend_url": "",
    }
    cfg["indexing"] = {
        "roots": r"C:\Users",
        "last_full_scan": "",
        "registered": "false",
    }
    return cfg


def get_config() -> configparser.ConfigParser:
    """Return a ConfigParser loaded from CONFIG_PATH.
    Creates the file with defaults if it does not yet exist."""
    _ensure_app_dir()
    cfg = _default_config()
    if os.path.exists(CONFIG_PATH):
        cfg.read(CONFIG_PATH, encoding="utf-8")
    else:
        with open(CONFIG_PATH, "w", encoding="utf-8") as fh:
            cfg.write(fh)
    return cfg


def set_value(section: str, key: str, value: str) -> None:
    """Write a single key to the config file."""
    cfg = get_config()
    if not cfg.has_section(section):
        cfg.add_section(section)
    cfg.set(section, key, value)
    _ensure_app_dir()
    with open(CONFIG_PATH, "w", encoding="utf-8") as fh:
        cfg.write(fh)


def get_roots() -> list[str]:
    """Return the list of root paths to scan (one per line in config)."""
    cfg = get_config()
    raw = cfg.get("indexing", "roots", fallback=r"C:\Users")
    return [p.strip() for p in raw.splitlines() if p.strip()]


def set_roots(roots: list[str]) -> None:
    """Persist a list of root paths to config."""
    set_value("indexing", "roots", "\n".join(roots))


def set_jwt(token: str, backend_url: str) -> None:
    """Save authentication credentials."""
    cfg = get_config()
    if not cfg.has_section("auth"):
        cfg.add_section("auth")
    cfg.set("auth", "jwt_token", token)
    cfg.set("auth", "backend_url", backend_url)
    _ensure_app_dir()
    with open(CONFIG_PATH, "w", encoding="utf-8") as fh:
        cfg.write(fh)


def is_registered() -> bool:
    cfg = get_config()
    return cfg.getboolean("indexing", "registered", fallback=False)


def mark_registered() -> None:
    set_value("indexing", "registered", "true")
