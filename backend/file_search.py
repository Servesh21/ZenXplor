import os
import string
import logging
import threading
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, IndexedFile
from elasticsearch import Elasticsearch, helpers
from flask_cors import CORS
from flask import current_app
import time

from sqlalchemy.orm import scoped_session, sessionmaker
from flask import send_file
import platform , subprocess
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from datetime import datetime
# Elasticsearch Setup
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch([ELASTICSEARCH_URL])

search_bp = Blueprint("search", __name__)
CORS(search_bp, supports_credentials=True, origins=["http://localhost:5173"])

logging.basicConfig(level=logging.INFO)
indexing_status = {}

from models import CloudStorageAccount
AUTO_SYNC_INTERVAL = 600 

def get_access_token(account_id):
    """Fetch the access token for a specific Google Drive account."""
    account = CloudStorageAccount.query.filter_by(id=account_id, provider="Google Drive").first()
    return account.access_token if account else None

def get_available_drives():
    """Return only the current user's directory in C drive."""
    user_home = os.path.expanduser("~")  # Gets C:/Users/<username>
    return [user_home] if os.path.exists(user_home) else []

def sanitize_filepath(filepath):
    return filepath.encode("utf-8", "ignore").decode("utf-8")  # Removes invalid characters

def index_files_worker(user_id, base_directory):
    """Index all folders and files recursively in a given drive/directory."""
    from app import app  
    with app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))  # Create a new session

        indexing_status[user_id] = "in_progress"
        indexed_items = []
        new_entries = []

        try:
            for root, dirs, files in os.walk(base_directory):
                print(f"Scanning: {root}")  # Debugging log
                
                # Index Directories
                for folder in dirs:
                    folder_path = sanitize_filepath(os.path.join(root, folder))
                    if session.query(IndexedFile).filter_by(filepath=folder_path, user_id=user_id).first():
                        continue
                    new_entries.append(IndexedFile(user_id=user_id, filename=folder, filepath=folder_path, is_folder=True))
                    indexed_items.append({"id": f"{user_id}_{folder_path}", "user_id": user_id, "filename": folder, "filepath": folder_path, "is_folder": True})

                # Index Files
                for file in files:
                    file_path = sanitize_filepath(os.path.join(root, file))
                    print(f"Indexing file: {file_path}")  # Debugging log
                    
                    if session.query(IndexedFile).filter_by(filepath=file_path, user_id=user_id).first():
                        continue
                    new_entries.append(IndexedFile(user_id=user_id, filename=file, filepath=file_path, is_folder=False))
                    indexed_items.append({"id": f"{user_id}_{file_path}", "user_id": user_id, "filename": file, "filepath": file_path, "is_folder": False})

            # Commit new entries to the database
            if new_entries:
                session.bulk_save_objects(new_entries)
                session.commit()
                print(f"Committed {len(new_entries)} files/folders to DB")  # Debugging log

            # Index in Elasticsearch
            if indexed_items:
                helpers.bulk(es, [{"_index": "file_index", "_id": item["id"], "_source": item} for item in indexed_items])
                print(f"Indexed {len(indexed_items)} items in Elasticsearch")  # Debugging log

        except Exception as e:
            logging.error(f"Error during indexing: {str(e)}")

        finally:
            session.remove()
            indexing_status[user_id] = "completed"


from sqlalchemy.dialects.postgresql import insert

def sync_google_drive(account_id, user_id):
    """Sync only the specified Google Drive account for a user, resolving conflicts properly."""
    access_token = get_access_token(account_id)
    if not access_token:
        logging.error(f"No valid access token found for account {account_id}")
        return

    with current_app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))

        creds = Credentials(token=access_token)
        service = build("drive", "v3", credentials=creds)

        try:
            files = []
            page_token = None

            # Fetch all files using pagination
            while True:
                response = service.files().list(
                    fields="nextPageToken, files(id, name, mimeType, modifiedTime)",
                    pageSize=100,  # Fetch in batches of 100
                    pageToken=page_token
                ).execute()
                files.extend(response.get("files", []))
                page_token = response.get("nextPageToken")
                if not page_token:
                    break

            new_entries = []
            update_count = 0

            for file in files:
                file_id = file["id"]
                last_modified = datetime.strptime(file["modifiedTime"], "%Y-%m-%dT%H:%M:%S.%fZ")

                # Prepare the insert statement with ON CONFLICT handling
                stmt = insert(IndexedFile).values(
                    user_id=user_id,
                    account_id=account_id,
                    filename=file["name"],
                    filepath=f"drive://{file_id}",
                    storage_type="google_drive",
                    cloud_file_id=file_id,
                    mime_type=file["mimeType"],
                    last_modified=last_modified
                ).on_conflict_do_update(
                    index_elements=["filepath"],  # This ensures the filepath uniqueness constraint is respected
                    set_={
                        "filename": file["name"],
                        "mime_type": file["mimeType"],
                        "last_modified": last_modified
                    }
                )
                
                session.execute(stmt)
                update_count += 1

            session.commit()
            logging.info(f"✅ Synced {update_count} files (new + updated) from Google Drive (Account {account_id}) for user {user_id}")

        except Exception as e:
            session.rollback()
            logging.error(f"Error syncing Google Drive (Account {account_id}): {str(e)}")

        finally:
            session.remove()

def auto_sync_google_drive():
    """Automatically sync all Google Drive accounts periodically."""
    while True:
        with current_app.app_context():
            accounts = CloudStorageAccount.query.filter_by(provider="google_drive").all()
            for account in accounts:
                sync_google_drive(account.id, account.user_id)

        time.sleep(AUTO_SYNC_INTERVAL)


def start_auto_sync_thread():
    """Start auto-sync in a background thread."""
    threading.Thread(target=auto_sync_google_drive, daemon=True).start()

@search_bp.route("/index-files", methods=["POST"])
@jwt_required()
def index_files():
    """Start indexing all drives and files recursively."""
    if not check_elasticsearch():
        return jsonify({"error": "Elasticsearch is not available"}), 500

    user_id = get_jwt_identity()
    drives = get_available_drives()
    indexing_status[user_id] = "starting"

    for drive in drives:
        threading.Thread(target=index_files_worker, args=(user_id, drive)).start()

    return jsonify({"message": f"Indexing started for drives: {drives}"}), 202
@search_bp.route("/index-status", methods=["GET"])
@jwt_required()
def get_index_status():
    """Check indexing status for the user."""
    user_id = get_jwt_identity()
    status = indexing_status.get(user_id, "not_started")
    return jsonify({"status": status})


@search_bp.route("/search-files", methods=["GET"])
@jwt_required()
def search_files():
    """Search files by name for both local storage and cloud storage."""
    if not check_elasticsearch():
        return jsonify({"error": "Search service unavailable"}), 500

    user_id = get_jwt_identity()
    query = request.args.get("q", "").strip().lower()

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    results = []

    # 1️⃣ Search in Elasticsearch (Local Storage)
    try:
        es_results = es.search(index="file_index", body={
            "query": {
                "bool": {
                    "must": [
                        {"match": {"filename": query}},
                        {"match": {"user_id": user_id}}
                    ]
                }
            }
        })
        results.extend([hit["_source"] for hit in es_results["hits"]["hits"]])
    except Exception as e:
        logging.error(f"Elasticsearch search error: {str(e)}")

    # 2️⃣ Search in Indexed DB (Google Drive)
    with current_app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))
        drive_files = session.query(IndexedFile).filter(
            IndexedFile.user_id == user_id,
            IndexedFile.filename.ilike(f"%{query}%"),
            IndexedFile.storage_type == "google_drive"
        ).all()
        session.remove()

        results.extend([
            {
                "filename": file.filename,
                "cloud_file_id": file.cloud_file_id,
                "storage_type": "google_drive",
                "filepath": file.filepath
            } for file in drive_files
        ])

    return jsonify(results), 200

def search_google_drive_files(access_token, query):
    """Search Google Drive for files matching query."""
    creds = Credentials(token=access_token)
    service = build("drive", "v3", credentials=creds)

    response = service.files().list(q=f"name contains '{query}'", fields="files(id, name, mimeType)").execute()
    files = response.get("files", [])
    
    
    return [{"filename": file["name"], "cloud_file_id": file["id"], "storage_type": "google_drive"} for file in files]



@search_bp.route("/open-file", methods=["POST"])
@jwt_required()
def open_file():
    """Open file location in File Explorer, Finder, or File Manager."""
    user_id = get_jwt_identity()
    data = request.get_json()
    file_path = data.get("filepath")

    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid file path"}), 400

    file_record = IndexedFile.query.filter_by(filepath=file_path, user_id=user_id).first()
    if not file_record:
        return jsonify({"error": "Unauthorized access"}), 403

    try:
        if platform.system() == "Windows":
            subprocess.run(["explorer", "/select,", file_path], check=True)
        else:
            subprocess.run(["xdg-open", file_path], check=True)

        return jsonify({"message": "File opened successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to open file: {str(e)}"}), 500
    
@search_bp.route("/sync-cloud-storage", methods=["POST"])
@jwt_required()
def sync_google_drive_account():
    """Sync a specific Google Drive account for the user."""
    user_id = get_jwt_identity()
    data = request.json
    account_id = data.get("account_id")


    if not account_id:
        return jsonify({"error": "Account ID is required"}), 400

    try:
        sync_google_drive(account_id, user_id)
        return jsonify({"message": f"Google Drive sync started for account {account_id}"}), 200
    except Exception as e:
        logging.error(f"Error syncing Google Drive (Account {account_id}): {str(e)}")
        return jsonify({"error": "Failed to sync Google Drive"}), 500
    

def check_elasticsearch():
    """Check if Elasticsearch is reachable."""
    if not es.ping():
        logging.error("Elasticsearch server is not reachable")
        return False
    return True



@search_bp.route("/download-file", methods=["GET"])
@jwt_required()
def download_file():
    """Allow authenticated users to download a file."""
    user_id = get_jwt_identity()
    file_path = request.args.get("filepath")

    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid file path"}), 400

    # Ensure the user has permission to download the file
    file_record = IndexedFile.query.filter_by(filepath=file_path, user_id=user_id).first()
    if not file_record:
        return jsonify({"error": "Unauthorized access"}), 403

    try:
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({"error": f"Failed to download file: {str(e)}"}), 500