import os
from extensions import db
from datetime import datetime
import re
import random
from werkzeug.security import generate_password_hash, check_password_hash

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
        """Allows updating profile picture with external URL or local file."""
        if new_picture_url.startswith("http"):
            if not re.match(r"^https?://.*\.(png|jpg|jpeg|webp)$", new_picture_url, re.IGNORECASE):
                raise ValueError("Profile picture must be a valid image URL.")
            self.profile_picture = new_picture_url
        else:
            self.profile_picture = new_picture_url  # Local file name
        db.session.commit()


class IndexedFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  # User-specific access
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False, unique=True)
    is_folder = db.Column(db.Boolean, nullable=False, default=False)  # ✅ Add this
    content_hash = db.Column(db.String(64), nullable=True)  # Optional for text search

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "filepath": self.filepath,
            "is_folder": self.is_folder  # ✅ Include this in dict
        }