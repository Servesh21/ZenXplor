import requests

# Test the access endpoint directly
BACKEND_URL = "http://localhost:5000/search/file/access"

# We need a JWT token. This is a bit hard without user login.
# Let's write a python script that runs via app_context to test the logic directly instead.

from app import app
from extensions import db
from models import IndexedFile

with app.app_context():
    f = IndexedFile.query.filter_by(user_id=1, is_folder=False).first()
    print("Found file:", f.filepath)
    f2 = IndexedFile.query.filter_by(filepath=f.filepath, user_id=1).first()
    print("Found via filepath:", f2.filename)

