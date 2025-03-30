from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from auth import auth_bp
from flask_cors import CORS
import os
from extensions import db  # db is defined in extensions.py
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from file_search import search_bp, start_auto_sync_threads  # Updated import
from cloudstorage import cloud_storage_bp  # Import your cloud storage blueprint

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Enable CORS for the entire app
CORS(app, supports_credentials=True, origins=["http://localhost:5173"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization"])

# Database Configuration (PostgreSQL)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")  # Ensure DATABASE_URI is in .env
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Set secret keys (used for sessions and JWT)
app.secret_key = os.getenv("SECRET_KEY")  # Ensure SECRET_KEY is in .env
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)

# JWT Configuration
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production (HTTPS)
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

jwt = JWTManager(app)

# Register Blueprints BEFORE running the app
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(search_bp, url_prefix="/search")  
app.register_blueprint(cloud_storage_bp)  

if __name__ == "__main__":
    print("Starting auto-sync threads...")  # Debug
    start_auto_sync_threads()  # Start auto-sync threads for Local & Cloud storage
    print("Flask app is running...")  # Debug
    app.run(debug=True)