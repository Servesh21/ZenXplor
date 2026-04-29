from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import os
import threading
from datetime import timedelta

from auth import auth_bp
from extensions import db
from file_search import search_bp, start_auto_sync_threads, es
from cloudstorage import cloud_storage_bp
from config import Config

from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()

app = Flask(__name__)
# ── Trust Render's reverse proxy headers (X-Forwarded-For, X-Forwarded-Proto, etc.) ──
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.config.from_object(Config)

# ── Also wire the JWT secret from the Config SECRET_KEY ───────────────────────
app.secret_key = app.config["SECRET_KEY"]
app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

# ── JWT cookie settings ───────────────────────────────────────────────────────
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_COOKIE_SECURE"] = os.getenv("FLASK_ENV", "development") == "production"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

# ── Session Cookie Settings ───────────────────────────────────────────────────
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True

# ── CORS ──────────────────────────────────────────────────────────────────────
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),
]
_allowed_origins = [o for o in _allowed_origins if o]

CORS(
    app,
    supports_credentials=True,
    origins=_allowed_origins,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Extensions ────────────────────────────────────────────────────────────────
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# ── Thread pool (Render safe) ─────────────────────────────────────────────────
executor = ThreadPoolExecutor(max_workers=3)

# ── Sync concurrency limiter ──────────────────────────────────────────────────
_sync_semaphore = threading.Semaphore(3)
app.config["SYNC_SEMAPHORE"] = _sync_semaphore

@app.teardown_appcontext
def shutdown_executor(exception=None):
    global executor
    if executor:
        executor.shutdown(wait=False)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(search_bp, url_prefix="/search")
app.register_blueprint(cloud_storage_bp)

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return {"status": "ok"}, 200


# ─────────────────────────────────────────────────────────────────────────────
# 🔥 AUTO INIT (DB + Elasticsearch) — replaces steps 2.4 and 2.5
# ─────────────────────────────────────────────────────────────────────────────

def create_es_index():
    try:
        if not es.indices.exists(index="file_index"):
            es.indices.create(
                index="file_index",
                body={
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    },
                    "mappings": {
                        "properties": {
                            "filename": {"type": "text"},
                            "filename_ngram": {"type": "text"},
                            "filepath": {"type": "keyword"},
                            "filetype": {"type": "keyword"},
                            "storage_type": {"type": "keyword"},
                            "user_id": {"type": "integer"},
                            "is_folder": {"type": "boolean"},
                            "is_favorite": {"type": "boolean"}
                        }
                    }
                }
            )
            print("✅ Elasticsearch index created")
        else:
            print("ℹ️ Elasticsearch index already exists")
    except Exception as e:
        print("❌ Elasticsearch init failed:", e)


def initialize_app():
    print("🚀 Initializing application...")

    # Ensure tables are created
    try:
        db.create_all()
        print("✅ Database tables created (if they didn't exist)")
    except Exception as e:
        print("❌ DB creation error:", e)

    # Run DB migrations
    try:
        upgrade()
        print("✅ Database migrated")
    except Exception as e:
        print("❌ Migration error:", e)

    # Create Elasticsearch index
    create_es_index()


# Run initialization ON STARTUP (production-safe)
with app.app_context():
    initialize_app()


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV", "development") != "production"
    print("Flask app is running…")
    app.run(debug=debug)
