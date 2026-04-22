from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import os
import threading

from auth import auth_bp
from extensions import db
from file_search import search_bp, start_auto_sync_threads
from cloudstorage import cloud_storage_bp
from config import Config

load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

# ── Also wire the JWT secret from the Config SECRET_KEY ───────────────────────
app.secret_key = app.config["SECRET_KEY"]
app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]

# ── JWT cookie settings ───────────────────────────────────────────────────────
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_COOKIE_SECURE"] = os.getenv("FLASK_ENV", "development") == "production"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

# ── CORS: allow local dev + any deployed Vercel/production frontend ───────────
_allowed_origins = [
    "http://localhost:5173",           # local Vite dev
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),     # set this on Render to your Vercel URL
]
# Filter out empty strings
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

# ── Thread pool for background indexing tasks ─────────────────────────────────
# Limit to 3 workers on Render free tier to stay within RAM budget.
executor = ThreadPoolExecutor(max_workers=3)

# ── Concurrency limiter for the agent sync endpoint ───────────────────────────
# Prevents memory spikes if many agents POST simultaneously (shouldn't happen
# normally, but guard against it on the 512 MB Render free tier).
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

# ── Health check (Render pings this to keep the service alive) ────────────────
@app.route("/health")
def health():
    return {"status": "ok"}, 200

if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV", "development") != "production"
    print("Flask app is running…")
    app.run(debug=debug)
