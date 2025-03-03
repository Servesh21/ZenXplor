from extensions import db
from datetime import datetime
import re
import random
from werkzeug.security import generate_password_hash, check_password_hash

# Default profile picture options
DEFAULT_PROFILE_PICTURES = [
   "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale'",
   "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
   'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light',
   'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale',
   'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown'
]


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)  # Store hashed password
    profile_picture = db.Column(db.String(1000), nullable=True)  # Profile picture URL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, username, email, password, profile_picture=None):
        self.username = username
        self.email = self.validate_email(email)  # Validate email format
        self.password_hash = self.set_password(password)  # Hash password
        self.profile_picture = profile_picture or DEFAULT_PROFILE_PICTURES[0]  # Always set the first profile pic

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

    def update_profile_picture(self, new_picture_url):
        """Allows user to update their profile picture (only PNG or JPG)."""
        if not re.match(r"^https?://.*\.(png|jpg|jpeg)$", new_picture_url, re.IGNORECASE):
            raise ValueError("Profile picture must be a valid PNG or JPG URL.")
        self.profile_picture = new_picture_url
        db.session.commit()