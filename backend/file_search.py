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
import dropbox
from dropbox.exceptions import AuthError
from sqlalchemy.dialects.postgresql import insert
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
from models import CloudStorageAccount

# Elasticsearch Setup
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch([ELASTICSEARCH_URL])

DROPBOX_CLIENT_ID = os.getenv("DROPBOX_CLIENT_ID")
DROPBOX_CLIENT_SECRET = os.getenv("DROPBOX_CLIENT_SECRET")
search_bp = Blueprint("search", __name__)
CORS(search_bp, supports_credentials=True, origins=["http://localhost:5173"])

logging.basicConfig(level=logging.INFO)
indexing_status = {}


AUTO_SYNC_INTERVAL_LOCAL = 30
AUTO_SYNC_INTERVAL=30

EXCLUDE_DIRS = {"AppData","node_modules", ".git", ".Trash", "System Volume Information",".venv",".gradle"}
EXCLUDE_FILES = {".DS_Store", "thumbs.db"}

indexing_status = {}

def get_available_drives():
    """Return all available drives."""
    if os.name == 'nt':  # Windows
        import psutil
        return [dp.device for dp in psutil.disk_partitions()]
    else:  # Linux/macOS
        return ["/"]  # Root directory
    
def is_valid_file(file_path):
    """Check if the file should be indexed."""
    file_name = os.path.basename(file_path).lower()
    return (
        file_name not in EXCLUDE_FILES
    )

def is_valid_dir(dir_path):
    """Check if the directory should be indexed."""
    dir_name = os.path.basename(dir_path)
    return dir_name not in EXCLUDE_DIRS

def get_user_dirs():
    """Get valid user directories inside C:/Users."""
    users_path = "C:/Users"
    if os.path.exists(users_path):
        return [
            os.path.join(users_path, user) 
            for user in os.listdir(users_path) 
            if os.path.isdir(os.path.join(users_path, user)) and is_valid_dir(os.path.join(users_path, user))
        ]
    return []

from concurrent.futures import ThreadPoolExecutor

def auto_index_local_storage():
    """Periodically check for new files and index only them, avoiding reindexing existing ones."""
    while True:
        with current_app.app_context():
            users = db.session.query(IndexedFile.user_id).distinct().all()
            user_dirs = get_user_dirs()

            with ThreadPoolExecutor(max_workers=5) as executor:  # Limit threads to avoid overload
                for (user_id,) in users:
                    for user_dir in user_dirs:
                        if is_valid_dir(user_dir):
                            executor.submit(index_new_files_only, user_id, user_dir)

        from concurrent.futures import ThreadPoolExecutor

def auto_index_local_storage():
    """Periodically check for new files and index only them, avoiding reindexing existing ones."""
    while True:
        with current_app.app_context():
            users = db.session.query(IndexedFile.user_id).distinct().all()
            user_dirs = get_user_dirs()

            with ThreadPoolExecutor(max_workers=5) as executor:  # Limit threads to avoid overload
                for (user_id,) in users:
                    for user_dir in user_dirs:
                        if is_valid_dir(user_dir):
                            executor.submit(index_new_files_only, user_id, user_dir)

        time.sleep(AUTO_SYNC_INTERVAL)



def index_new_files_only(user_id, base_directory):
    """Index only new files that are not already present in the database."""
    from app import app  
    with app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))  # New DB session
        
        indexed_items = []
        new_entries = []

        try:
            for root, dirs, files in os.walk(base_directory):
                dirs[:] = [d for d in dirs if is_valid_dir(os.path.join(root, d))]  # Filter out unnecessary dirs

                for file in files:
                    file_path = sanitize_filepath(os.path.join(root, file))

                    if not is_valid_file(file_path):  # Exclude unnecessary files
                        continue

                    # ✅ Check if the file is already indexed
                    if session.query(IndexedFile).filter_by(filepath=file_path, user_id=user_id).first():
                        continue  # Skip already indexed files

                    print(f"New file detected: {file_path}")  # Debugging log

                    # Add new file entry
                    new_entries.append(IndexedFile(
                        user_id=user_id,
                        filename=file,
                        filepath=file_path,
                        is_folder=False
                    ))
                    indexed_items.append({
                        "id": f"{user_id}_{file_path}",
                        "user_id": user_id,
                        "filename": file,
                        "filepath": file_path,
                        "is_folder": False
                    })

            # Commit only new entries to DB
            if new_entries:
                session.bulk_save_objects(new_entries)
                session.commit()
                print(f"✅ Indexed {len(new_entries)} new files")  # Debugging log

            # Index new files in Elasticsearch
            if indexed_items:
                helpers.bulk(es, [
                    {"_index": "file_index", "_id": item["id"], "_source": item}
                    for item in indexed_items
                ])
                print(f"✅ Added {len(indexed_items)} new items to Elasticsearch")  # Debugging log

        except Exception as e:
            logging.error(f"Error during indexing new files: {str(e)}")

        finally:
            session.remove()



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


def auto_sync_dropbox():
    """Automatically sync Dropbox accounts every 30 seconds."""
    while True:
        with current_app.app_context():
            accounts = CloudStorageAccount.query.filter_by(provider="dropbox").all()
            for account in accounts:
                sync_dropbox(account.id, account.user_id)
        time.sleep(AUTO_SYNC_INTERVAL)



auto_sync_started = False  # Global flag

def start_auto_sync_threads():
    """Starts watchers for local storage and cloud sync, but only once."""
    global auto_sync_started
    if auto_sync_started:
        return  # Prevent multiple invocations
    from app import app 
    threading.Thread(target=run_with_app_context, args=(app, auto_index_local_storage)).start()
    threading.Thread(target=run_with_app_context, args=(app, auto_sync_google_drive)).start()
    threading.Thread(target=run_with_app_context, args=(app, auto_sync_dropbox)).start()
    
    auto_sync_started = True  # Mark as started


def run_with_app_context(app, func, *args):
    """Runs a function inside the Flask app context in a separate thread."""
    with app.app_context():
        func(*args)

def get_access_token(account_id):
    """Fetch the access token for a specific Google Drive account."""
    account = CloudStorageAccount.query.filter_by(id=account_id, provider="Google Drive").first()
    return account.access_token if account else None

def get_available_drives():
    """Return only the current user's directory in C drive."""
    user_home = os.path.expanduser("~")  # Gets C:/Users/<username>
    return [user_home] if os.path.exists(user_home) else []

def sanitize_filepath(path):
    """Sanitize file paths to ensure consistency."""
    return os.path.abspath(path)

def index_files_worker(user_id, base_directory):
    """Index all folders and files recursively in a given drive/directory with prefix search support."""
    from app import app 
    with app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))  # New DB session

        indexing_status[user_id] = "in_progress"
        indexed_items = []
        new_entries = []

        try:
            for root, dirs, files in os.walk(base_directory):
                # Filter out excluded directories
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
                print(f"Scanning: {root}")  # Debugging log
                
                # Index Directories
                for folder in dirs:
                    folder_path = sanitize_filepath(os.path.join(root, folder))
                    if session.query(IndexedFile).filter_by(filepath=folder_path, user_id=user_id).first():
                        continue
                    new_entries.append(IndexedFile(user_id=user_id, filename=folder, filepath=folder_path, is_folder=True))
                    indexed_items.append({
                        "id": f"{user_id}_{folder_path}",
                        "user_id": user_id,
                        "filename": folder,
                        "filename_ngram": folder.lower(),  # 👈 Add ngram field for prefix search
                        "filepath": folder_path,
                        "is_folder": True
                    })

                # Index Files
                for file in files:
                    file_path = sanitize_filepath(os.path.join(root, file))
                    if file in EXCLUDE_FILES or file.startswith("."):
                        continue  # Skip hidden/system files

                    print(f"Indexing file: {file_path}")  # Debugging log
                    
                    if session.query(IndexedFile).filter_by(filepath=file_path, user_id=user_id).first():
                        continue
                    new_entries.append(IndexedFile(user_id=user_id, filename=file, filepath=file_path, is_folder=False))
                    indexed_items.append({
                        "id": f"{user_id}_{file_path}",
                        "user_id": user_id,
                        "filename": file,
                        "filename_ngram": file.lower(),  # 👈 Add ngram field for prefix search
                        "filepath": file_path,
                        "is_folder": False
                    })

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
    """Automatically sync Google Drive accounts every 30 seconds."""
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
    user_id = get_jwt_identity()
    
    if not check_elasticsearch():
        return jsonify({"error": "Elasticsearch is not available"}), 500

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
    """Search files with fuzzy matching, prefix-based search, and pagination."""
    
    if not check_elasticsearch():
        return jsonify({"error": "Search service unavailable"}), 500

    user_id = get_jwt_identity()
    query = request.args.get("q", "").strip().lower()
    limit = request.args.get("limit", 10, type=int)  # Default: 10 results per page
    offset = request.args.get("offset", 0, type=int)  # Default: Start from 0

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    results = []

    # 1️⃣ **Prefix + Fuzzy Search in Elasticsearch (Local Storage)**
    try:
        es_results = es.search(index="file_index", body={
            "query": {
                "bool": {
                    "should": [
                        { "prefix": { "filename": query } },  # Prefix search (autocomplete)
                        { "match": { "filename": { "query": query, "fuzziness": "AUTO" } } }  # Fuzzy search (typos)
                    ],
                    "filter": [
                        { "term": { "user_id": user_id } }  # Only return files for the user
                    ]
                }
            },
            "from": offset,
            "size": limit  # Pagination in Elasticsearch
        })
        results.extend([hit["_source"] for hit in es_results["hits"]["hits"]])
    except Exception as e:
        logging.error(f"Elasticsearch search error: {str(e)}")

    # 2️⃣ **Prefix + Fuzzy Search in Indexed DB (Google Drive + Dropbox)**
    with current_app.app_context():
        session = scoped_session(sessionmaker(bind=db.engine))

        cloud_files = session.query(IndexedFile).filter(
            IndexedFile.user_id == user_id,
            IndexedFile.filename.ilike(f"%{query}%"),  # Fuzzy match (SQL LIKE)
            IndexedFile.storage_type.in_(["google_drive", "dropbox"])
        ).offset(offset).limit(limit).all()  # Pagination for cloud files

        session.remove()

        results.extend([
            {
                "filename": file.filename,
                "cloud_file_id": file.cloud_file_id,
                "storage_type": file.storage_type,
                "filepath": file.filepath
            } for file in cloud_files
        ])

    # Return paginated results
    return jsonify({
        "results": results,
        "offset": offset,
        "limit": limit,
        "has_more": len(results) == limit  # Check if more results exist
    }), 200


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
    


