import os
import string
import logging
import threading
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, IndexedFile
from elasticsearch import Elasticsearch, helpers
from flask_cors import CORS
from sqlalchemy.orm import scoped_session, sessionmaker

import platform , subprocess

# Elasticsearch Setup
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch([ELASTICSEARCH_URL])

search_bp = Blueprint("search", __name__)
CORS(search_bp, supports_credentials=True, origins=["http://localhost:5173"])

logging.basicConfig(level=logging.INFO)
indexing_status = {}

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
    """Search files by name for the authenticated user using Elasticsearch."""
    if not check_elasticsearch():
        return jsonify({"error": "Search service unavailable"}), 500

    user_id = get_jwt_identity()
    query = request.args.get("q", "").strip().lower()

    if not query:
        return jsonify({"error": "Search query is required"}), 400

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
    except Exception as e:
        logging.error(f"Elasticsearch search error: {str(e)}")
        return jsonify({"error": "Search service unavailable"}), 500

    results = [hit["_source"] for hit in es_results["hits"]["hits"]]
    return jsonify(results), 200


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
        elif platform.system() == "Darwin":
            subprocess.run(["open", "-R", file_path], check=True)
        else:
            subprocess.run(["xdg-open", file_path], check=True)

        return jsonify({"message": "File opened successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to open file: {str(e)}"}), 500
    



def check_elasticsearch():
    """Check if Elasticsearch is reachable."""
    if not es.ping():
        logging.error("Elasticsearch server is not reachable")
        return False
    return True