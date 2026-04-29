import os
from extensions import db
from app import app
from models import IndexedFile

with app.app_context():
    try:
        user_id = 1
        filters = [IndexedFile.user_id == user_id, IndexedFile.is_folder == False]
        recent_files = db.session.query(IndexedFile).filter(*filters)\
            .order_by(db.func.coalesce(IndexedFile.last_modified, IndexedFile.created_at).desc())\
            .limit(5).all()
        print("Success:", len(recent_files))
    except Exception as e:
        print("Error:", e)
