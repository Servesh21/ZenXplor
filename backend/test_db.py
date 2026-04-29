import os
import sys

# Setup environment to load the flask app
from extensions import db
from app import app
from models import IndexedFile, CloudStorageAccount

with app.app_context():
    try:
        user_id = 1 # Assuming user 1 exists
        
        # Check total files
        total = db.session.query(IndexedFile).count()
        print("Total files:", total)
        
        # Check files with is_folder = False
        not_folder = db.session.query(IndexedFile).filter(IndexedFile.is_folder == False).count()
        print("Not folder:", not_folder)
        
        # Check with user_id
        for uid in [1, 2, 3]:
            c = db.session.query(IndexedFile).filter(IndexedFile.user_id == uid).count()
            if c > 0:
                print(f"User {uid} files:", c)
                
        # Check recent
        recent = db.session.query(IndexedFile).filter(IndexedFile.user_id == 1, IndexedFile.is_folder == False).limit(5).all()
        print("Recent:", len(recent))
        
    except Exception as e:
        print("Error:", e)
