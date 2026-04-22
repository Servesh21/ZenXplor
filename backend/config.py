import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    # Render sets DATABASE_URL; local dev uses DATABASE_URI. Support both.
    SQLALCHEMY_DATABASE_URI = (
        os.getenv("DATABASE_URL") or
        os.getenv("DATABASE_URI", "postgresql://user:password@localhost:5432/zenxplor")
    )
    # Fix Render's postgres:// → postgresql:// (SQLAlchemy requirement)
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_TYPE = "filesystem"

    # ── Connection pool tuning for Render free tier (512 MB RAM) ───────────
    # Render's free PostgreSQL allows ~97 connections; keep pool small.
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,           # persistent connections kept open
        "max_overflow": 10,       # extra connections allowed under load
        "pool_timeout": 30,       # seconds to wait for a connection
        "pool_recycle": 1800,     # recycle connections every 30 min
        "pool_pre_ping": True,    # verify connection health before use
    }
