from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from auth import auth_bp
from flask_cors import CORS
import os
from extensions import db  # db is defined in extensions.py
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Enable CORS for specific domains
CORS(app, supports_credentials=True, origins=["http://localhost:5173"], 
     allow_headers=["Authorization", "Content-Type"], methods=["GET", "POST", "OPTIONS"])

# Database Configuration (PostgreSQL)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")  # Make sure DATABASE_URI is defined in .env
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Set secret keys (used for sessions and JWT)
app.secret_key = os.getenv("SECRET_KEY")  # Ensure SECRET_KEY is in your .env
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")


# Initialize SQLAlchemy with the app
db.init_app(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  # ✅ Read JWT from cookies
app.config["JWT_ACCESS_COOKIE_NAME"] = "user"  # ✅ Must match the login cookie name
app.config["JWT_COOKIE_SECURE"] = False  # ❌ Change to True in production
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # ✅ Disable CSRF protection for testing
# Initialize JWT Manager
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")

# Run migrations (use migrations in production, not create_all)
with app.app_context():
    # db.create_all()  # Avoid using create_all in production. Instead, use flask-migrate.
    pass

if __name__ == "__main__":
    app.run(debug=True)