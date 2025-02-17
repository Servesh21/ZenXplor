from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from auth import auth_bp
from flask_cors import CORS
import os
from extensions import db  # db is defined in extensions.py
from flask_jwt_extended import JWTManager

from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/auth/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Database Configuration (update as needed)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Set secret keys (used for sessions and JWT)
app.secret_key = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")

# Session configuration (for cookie-based sessions)
# app.config["SESSION_TYPE"] = "filesystem"
# app.config["SESSION_COOKIE_NAME"] = "user_session"
# app.config["SESSION_PERMANENT"] = False
# app.config["SESSION_USE_SIGNER"] = True

# Initialize SQLAlchemy with the app
db.init_app(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Initialize JWT Manager
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")

# Create tables (for development purposes, use migrations in production)
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
