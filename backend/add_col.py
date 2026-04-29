from app import app
from extensions import db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE indexed_file ADD COLUMN last_accessed TIMESTAMP;"))
        db.session.commit()
        print("Successfully added last_accessed column to indexed_file table.")
    except Exception as e:
        print("Error adding column (it might already exist):", e)
