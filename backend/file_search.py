import os, io, logging
import logging
from googleapiclient.http import MediaIoBaseDownload
import threading
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, IndexedFile
from elasticsearch import Elasticsearch, helpers
from flask_cors import CORS
from flask import current_app
import time
from flask import Blueprint, jsonify, send_file, current_app, request as flask_request
from sqlalchemy.orm import scoped_session, sessionmaker
from flask import send_file
import platform , subprocess
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from datetime import datetime
# Elasticsearch Setup
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch([ELASTICSEARCH_URL])

DROPBOX_CLIENT_ID = os.getenv("DROPBOX_CLIENT_ID")
DROPBOX_CLIENT_SECRET = os.getenv("DROPBOX_CLIENT_SECRET")
search_bp = Blueprint("search", __name__)
CORS(search_bp, supports_credentials=True, origins=["http://localhost:5173"])

logging.basicConfig(level=logging.INFO)
indexing_status = {}

from models import CloudStorageAccount
AUTO_SYNC_INTERVAL = 6

import dropbox
from dropbox.exceptions import AuthError
from sqlalchemy.dialects.postgresql import insert

def get_dropbox_access_token(account_id):
    """Fetch the access token for a specific Dropbox account."""
    account = CloudStorageAccount.query.filter_by(id=account_id, provider="Dropbox").first()
    return account.access_token if account else None

def fetch_dropbox_files(dbx, path=""):
    """Recursively fetch files from Dropbox."""
    try:
        result = dbx.files_list_folder(path, recursive=True)
        files = []

        while True:
            for entry in result.entries:
                if isinstance(entry, dropbox.files.FileMetadata):
                    files.append(entry)
            if not result.has_more:
                break
            result = dbx.files_list_folder_continue(result.cursor)

        return files
    except Exception as e:
        logging.error(f"Dropbox API Error: {str(e)}")
        return []

def sync_dropbox(account_id, user_id):
    """Sync Dropbox files for a specific user."""
    access_token = get_dropbox_access_token(account_id)
    if not access_token:
        logging.error(f"No valid access token found for account {account_id}")
        return

    dbx = dropbox.Dropbox(access_token)

    try:
        dbx.users_get_current_account()
    except AuthError:
        logging.error("Invalid Dropbox access token")
        return

    with current_app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))

        try:
            files = fetch_dropbox_files(dbx)
            update_count = 0

            for file in files:
                file_path = file.path_display
                last_modified = file.server_modified

                stmt = insert(IndexedFile).values(
                    user_id=user_id,
                    account_id=account_id,
                    filename=file.name,
                    filepath=f"dropbox://{file_path}",
                    storage_type="dropbox",
                    cloud_file_id=file.id,
                    mime_type=file.content_hash,
                    last_modified=last_modified
                ).on_conflict_do_update(
                    index_elements=["filepath"],
                    set_={
                        "filename": file.name,
                        "mime_type": file.content_hash,
                        "last_modified": last_modified
                    }
                )

                session.execute(stmt)
                update_count += 1

            session.commit()
            logging.info(f"✅ Synced {update_count} files (new + updated) from Dropbox (Account {account_id}) for user {user_id}")

        except Exception as e:
            session.rollback()
            logging.error(f"Error syncing Dropbox (Account {account_id}): {str(e)}")

        finally:
            session.remove()



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

    # 2️⃣ Search in Indexed DB (Google Drive + Dropbox)
    with current_app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))
    
    # Search Google Drive files
        cloud_files = session.query(IndexedFile).filter(
            IndexedFile.user_id == user_id,
            IndexedFile.filename.ilike(f"%{query}%"),
            IndexedFile.storage_type.in_(["google_drive", "dropbox"])  # Include Dropbox
        ).all()
    
        session.remove()

        results.extend([
            {
                "filename": file.filename,
                "cloud_file_id": file.cloud_file_id,
                "storage_type": file.storage_type,  # Can be Google Drive or Dropbox
                "filepath": file.filepath
            } for file in cloud_files
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
    """Open file location in File Explorer, Finder, or File Manager, or return cloud file URLs."""
    user_id = get_jwt_identity()
    data = request.get_json()
    file_path = data.get("filepath")

    if not file_path:
        return jsonify({"error": "File path is required"}), 400

    file_record = IndexedFile.query.filter_by(filepath=file_path, user_id=user_id).first()
    if not file_record:
        return jsonify({"error": "Unauthorized access"}), 403

    storage_type = file_record.storage_type  # "local", "google_drive", "dropbox"
    cloud_file_id = file_record.cloud_file_id  # Used for Google Drive & Dropbox

    try:
        if storage_type == "local":
            if not os.path.exists(file_path):
                return jsonify({"error": "File not found"}), 400

            if platform.system() == "Windows":
                subprocess.run(["explorer", "/select,", file_path], check=True)
            else:
                subprocess.run(["xdg-open", file_path], check=True)

            return jsonify({"message": "File opened successfully"}), 200

        elif storage_type == "google_drive":
            drive_url = f"https://drive.google.com/uc?id={cloud_file_id}"
            return jsonify({"url": drive_url})

        elif storage_type == "dropbox":
            # For Dropbox, we need to construct the URL using the file path
            # Dropbox API does not provide a direct URL for files, so we use the path
            # Example: https://www.dropbox.com/home/<path>?preview=<filename>
            file = file_record.filename  # Get the filename from the record
            print(f"File: {file}")  # Debugging log
            filepath = file_record.filepath.replace("dropbox://", "")

            dropbox_url = f"https://www.dropbox.com/home/{filepath}?preview={file}"
            return jsonify({"url": dropbox_url})

        else:
            return jsonify({"error": "Unsupported storage type"}), 400

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

@search_bp.route("/sync-dropbox", methods=["POST"])
@jwt_required()
def sync_dropbox_account():
    """Sync a specific Dropbox account for the user."""
    user_id = get_jwt_identity()
    data = request.json
    account_id = data.get("account_id")

    if not account_id:
        return jsonify({"error": "Account ID is required"}), 400

    try:
        sync_dropbox(account_id, user_id)
        return jsonify({"message": f"Dropbox sync started for account {account_id}"}), 200
    except Exception as e:
        logging.error(f"Error syncing Dropbox (Account {account_id}): {str(e)}")
        return jsonify({"error": "Failed to sync Dropbox"}), 500

@search_bp.route("/download-file", methods=["GET"])
@jwt_required()
def download_file():
    """Allow authenticated users to download a file, including Google Drive files."""
    user_id = get_jwt_identity()
    file_path = flask_request.args.get("filepath")

    if not file_path:
        return jsonify({"error": "Invalid file path"}), 400

    file_record = IndexedFile.query.filter_by(filepath=file_path, user_id=user_id).first()
    if not file_record:
        return jsonify({"error": "Unauthorized access"}), 403

    # If the file is a local file, return it
    if file_record.storage_type != "google_drive":
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        return send_file(file_path, as_attachment=True)

    # For Google Drive files, download from Google Drive
    account = CloudStorageAccount.query.filter_by(user_id=user_id, provider="Google Drive").first()
    if not account:
        return jsonify({"error": "No linked Google Drive account"}), 400

    access_token = account.access_token
    if not access_token:
        return jsonify({"error": "Invalid Google Drive access token"}), 400

    drive_service = build("drive", "v3", credentials=Credentials(token=access_token))
    file_id = file_record.cloud_file_id

    try:
        drive_request = drive_service.files().get_media(fileId=file_id)
        file_stream = io.BytesIO()
        downloader = MediaIoBaseDownload(file_stream, drive_request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            download_name=file_record.filename,
            mimetype=file_record.mime_type or "application/octet-stream"
        )
    except Exception as e:
        logging.error(f"Failed to download file from Google Drive: {str(e)}")
        return jsonify({"error": f"Failed to download file from Google Drive: {str(e)}"}), 500
    


