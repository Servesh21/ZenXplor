from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import os

# Import custom modules
from auth import auth_bp
from extensions import db  # db is defined in extensions.py
from file_search import search_bp, start_auto_sync_threads
from cloudstorage import cloud_storage_bp

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# ✅ Initialize executor globally
executor = ThreadPoolExecutor(max_workers=5)

@app.teardown_appcontext
def shutdown_executor(exception=None):
    """Shutdown executor when the app stops."""
    global executor
    if executor:
        executor.shutdown(wait=False)

# Enable CORS for the entire app
CORS(app, supports_credentials=True, origins=['http://localhost:5173'], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization"])

# ✅ Database Configuration (PostgreSQL)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")  # Ensure DATABASE_URI is in .env
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ✅ Set secret keys (used for sessions and JWT)
app.secret_key = os.getenv("SECRET_KEY")  # Ensure SECRET_KEY is in .env
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")

# ✅ Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)

# ✅ JWT Configuration
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production (HTTPS)
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

jwt = JWTManager(app)

# ✅ Register Blueprints BEFORE running the app
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(search_bp, url_prefix="/search")  
app.register_blueprint(cloud_storage_bp)

# ✅ Ensure auto-sync runs even when using `flask run`
# with app.app_context():
#     print("Starting auto-sync threads...")  # Debugging log
#     start_auto_sync_threads(app)  # Start local & cloud sync

if __name__ == "__main__":
    print("Flask app is running...")  # Debug
    app.run(debug=True)
