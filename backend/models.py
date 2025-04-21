import os
import re
import random
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

# Default profile picture options
DEFAULT_PROFILE_PICTURES = [
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown"
]

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    profile_picture = db.Column(db.String(1000), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship with IndexedFile
    indexed_files = db.relationship('IndexedFile', backref='user', lazy=True, cascade="all, delete-orphan")

    def __init__(self, username, email, password, profile_picture=None):
        self.username = username
        self.email = self.validate_email(email)
        self.password_hash = self.set_password(password)
        self.profile_picture = profile_picture or random.choice(DEFAULT_PROFILE_PICTURES)

    def to_dict(self):
        """Return a dictionary representation of the user."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "profile_picture": self.profile_picture,
            "created_at": self.created_at.strftime("%B %d, %Y"),
        }

    @staticmethod
    def validate_email(email):
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, email):
            raise ValueError("Invalid email format")
        return email

    def set_password(self, password):
        if len(password) < 8 or not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
            raise ValueError("Password must be at least 8 characters long and contain both letters and numbers.")
        return generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def update_profile_picture(self, new_picture_url):
        """Update profile picture with a valid external URL or local file path."""
        if new_picture_url.startswith("http"):
            if not re.match(r"^https?://.*\.(png|jpg|jpeg|webp)$", new_picture_url, re.IGNORECASE):
                raise ValueError("Profile picture must be a valid image URL ending with .png, .jpg, .jpeg, or .webp.")
        self.profile_picture = new_picture_url
        db.session.commit()


from datetime import datetime
from models import db

class IndexedFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # ForeignKey for user association
    account_id = db.Column(db.Integer, db.ForeignKey('cloud_storage_account.id'), nullable=True)  # ForeignKey for cloud storage account
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False, unique=True)  # Local or cloud path
    filetype = db.Column(db.String(500), nullable=False)  # Ensure this field exists
    is_folder = db.Column(db.Boolean, nullable=False, default=False)  
    content_hash = db.Column(db.String(64), nullable=True)  # Optional for text search
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # Timestamp
    
    is_favorite = db.Column(db.Boolean, nullable=False, default=False)

    
    # New fields for cloud storage
    storage_type = db.Column(db.String(20), nullable=False, default="local")  # "local", "google_drive", etc.
    cloud_file_id = db.Column(db.String(1024), nullable=True, unique=True)  # Google Drive file ID, etc.
    mime_type = db.Column(db.String(1024), nullable=True)  # For cloud storage files
    last_modified = db.Column(db.DateTime, nullable=True)  # Last modified timestamp (for cloud files)


    # Relationship
    account = db.relationship('CloudStorageAccount', backref='indexed_files', lazy=True)

    def to_dict(self):
        return {
        "id": self.id,
        "user_id": self.user_id,
        "account_id": self.account_id,
        "filename": self.filename,
        "filepath": self.filepath,
        "filetype": self.filetype,
        "is_folder": self.is_folder,
        "storage_type": self.storage_type,
        "cloud_file_id": self.cloud_file_id,
        "mime_type": self.mime_type,
        "last_modified": self.last_modified.strftime("%B %d, %Y") if self.last_modified else None,
        "created_at": self.created_at.strftime("%B %d, %Y"),
        "is_favorite": self.is_favorite  # New field
        }


class CloudStorageAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Associate with user
    provider = db.Column(db.String(50), nullable=False)  # Example: "Google Drive"
    email = db.Column(db.String(100), nullable=False)
    access_token = db.Column(db.String(20000), nullable=False)  # Short-lived access token
    refresh_token = db.Column(db.String(1000), nullable=True)  # Store refresh token
    permissions = db.Column(db.Text, nullable=True)
    last_synced = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "provider": self.provider,
            "email": self.email,
            "permissions": self.permissions.split(",") if self.permissions else [],
            "lastSynced": self.last_synced.isoformat() if self.last_synced else None
        }
