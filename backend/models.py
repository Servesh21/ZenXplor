from extensions import db
from datetime import datetime
import re
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)  # Store hashed password
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, username, email, password):
        self.username = username
        self.email = self.validate_email(email)  # Validate email format
        self.password_hash = self.set_password(password)  # Hash password

    def to_dict(self):
        """Return a dictionary representation of the user."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.strftime("%B %d, %Y"),
        }

    @staticmethod
    def validate_email(email):
        """Validates email format."""
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, email):
            raise ValueError("Invalid email format")
        return email

    def set_password(self, password):
        """Hashes the password after validating it."""
        if len(password) < 8 or not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
            raise ValueError("Password must be at least 8 characters long and contain both letters and numbers.")
        return generate_password_hash(password)

    def check_password(self, password):
        """Verifies if the given password matches the stored hash."""
        return check_password_hash(self.password_hash, password)