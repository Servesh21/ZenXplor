from app import app
from extensions import db
from sqlalchemy import text

with app.app_context():
    try:
        # Check if table exists
        result = db.session.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'search_history');"))
        exists = result.scalar()
        if not exists:
            db.create_all()
            print("Successfully created SearchHistory table.")
        else:
            print("SearchHistory table already exists.")
    except Exception as e:
        print("Error creating table:", e)
