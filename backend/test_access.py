from app import app
from extensions import db
from models import IndexedFile
from datetime import datetime

with app.app_context():
    try:
        # Access a file
        f = db.session.query(IndexedFile).filter_by(user_id=1, is_folder=False).first()
        if f:
            f.last_accessed = datetime.utcnow()
            db.session.commit()
            print("Logged access for file:", f.filename)
            
        # Get recent
        recent = db.session.query(IndexedFile).filter(
            IndexedFile.user_id == 1, 
            IndexedFile.is_folder == False,
            IndexedFile.last_accessed.isnot(None)
        ).order_by(IndexedFile.last_accessed.desc()).limit(5).all()
        print("Recent accessed files:", [r.filename for r in recent])
        
    except Exception as e:
        print("Error:", e)
