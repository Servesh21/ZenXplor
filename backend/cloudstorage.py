import os
import string
import logging
import threading
import time
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify, redirect, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, CloudStorageAccount, IndexedFile
from elasticsearch import Elasticsearch, helpers
from flask_cors import CORS
from sqlalchemy.orm import scoped_session, sessionmaker
from flask import send_file
import platform, subprocess
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from jwt import decode, exceptions
from dotenv import load_dotenv

load_dotenv()

cloud_storage_bp = Blueprint("cloud_storage", __name__)
CORS(cloud_storage_bp, supports_credentials=True)

# Google OAuth Credentials (unchanged)
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/cloud-storage/callback"
FRONTEND_REDIRECT_URI = "http://localhost:5173/storage-overview"
TOKEN_URL = "https://oauth2.googleapis.com/token"

# Dropbox OAuth Credentials
DROPBOX_CLIENT_ID = os.getenv("DROPBOX_CLIENT_ID")
DROPBOX_CLIENT_SECRET = os.getenv("DROPBOX_CLIENT_SECRET")
DROPBOX_REDIRECT_URI = "http://localhost:5000/cloud-storage/dropbox/callback"
DROPBOX_TOKEN_URL = "https://api.dropbox.com/oauth2/token"

AUTO_SYNC_INTERVAL = 600  # seconds

# --------------------------
# Helper Functions for Token Refresh
# --------------------------

def refresh_access_token(refresh_token):
    """Refresh Google OAuth Access Token using the stored refresh token."""
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    try:
        response = requests.post(TOKEN_URL, data=data)
        response_data = response.json()
        if "access_token" in response_data:
            return response_data["access_token"]
        return None
    except Exception as e:
        print(f"Error refreshing Google token: {e}")
        return None

def refresh_dropbox_access_token(refresh_token):
    """Refresh Dropbox Access Token using the stored refresh token."""
    data = {
        "client_id": DROPBOX_CLIENT_ID,
        "client_secret": DROPBOX_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    try:
        response = requests.post(DROPBOX_TOKEN_URL, data=data)
        response_data = response.json()
        if "access_token" in response_data:
            return response_data["access_token"]
        return None
    except Exception as e:
        print(f"Error refreshing Dropbox token: {e}")
        return None

# --------------------------
# Callback Endpoints
# --------------------------

@cloud_storage_bp.route("/cloud-storage/callback", methods=["GET"])
@jwt_required()
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Authorization code not found"}), 400

    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post(TOKEN_URL, data=data)
    tokens = response.json()
    print("Google Tokens:", tokens)

    if "access_token" not in tokens or "refresh_token" not in tokens:
        return jsonify({"error": "Failed to retrieve tokens", "details": tokens}), 400

    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    user_info = requests.get(user_info_url, headers=headers).json()
    print("Google User Info:", user_info)
    email = user_info.get("email")
    if not email:
        return jsonify({"error": "Failed to retrieve email"}), 400

    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    existing_account = CloudStorageAccount.query.filter_by(user_id=user_id, email=email, provider="Google Drive").first()
    if existing_account:
        existing_account.access_token = tokens["access_token"]
        existing_account.refresh_token = tokens["refresh_token"]
        existing_account.last_synced = datetime.utcnow()
    else:
        new_account = CloudStorageAccount(
            user_id=user_id,
            provider="Google Drive",
            email=email,
            permissions="Read files, Search files, Access metadata",
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            last_synced=datetime.utcnow()
        )
        db.session.add(new_account)

    db.session.commit()
    frontend_redirect_url = f"{os.getenv('FRONTEND_REDIRECT_URI')}?status=success&email={email}"
    return redirect(frontend_redirect_url)

@cloud_storage_bp.route("/cloud-storage/dropbox/callback", methods=["GET"])
@jwt_required()
def dropbox_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Authorization code not found"}), 400
    print("Client ID:", DROPBOX_CLIENT_ID)
    data = {
        "code": code,
        "client_id": DROPBOX_CLIENT_ID,
        "client_secret": DROPBOX_CLIENT_SECRET,
        "redirect_uri": DROPBOX_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(DROPBOX_TOKEN_URL, data=data, headers=headers)
    tokens = response.json()
    print("Dropbox Tokens:", tokens)

    if "access_token" not in tokens:
        return jsonify({"error": "Failed to retrieve tokens", "details": tokens}), 400

    # Get user info from Dropbox
    user_info_url = "https://api.dropboxapi.com/2/users/get_current_account"
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    user_info = requests.post(user_info_url, headers=headers).json()
    print("Dropbox User Info:", user_info)
    email = user_info.get("email")
    if not email:
        return jsonify({"error": "Failed to retrieve email"}), 400

    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    existing_account = CloudStorageAccount.query.filter_by(user_id=user_id, email=email, provider="Dropbox").first()
    if existing_account:
        existing_account.access_token = tokens["access_token"]
        existing_account.last_synced = datetime.utcnow()
    else:
        new_account = CloudStorageAccount(
            user_id=user_id,
            provider="Dropbox",
            email=email,
            permissions="Read files, Search files",  # Adjust permissions as needed
            access_token=tokens["access_token"],
            last_synced=datetime.utcnow()
        )
        db.session.add(new_account)

    db.session.commit()
    frontend_redirect_url = f"{os.getenv('FRONTEND_REDIRECT_URI')}?status=success&email={email}"
    return redirect(frontend_redirect_url)

# --------------------------
# Fetch Connected Cloud Storage Accounts & Refresh Tokens
# --------------------------
@cloud_storage_bp.route("/cloud-accounts/<user_id>", methods=["GET"])
def get_cloud_accounts(user_id):
    try:
        accounts = CloudStorageAccount.query.filter_by(user_id=user_id).all()
        if not accounts:
            return jsonify({"message": "No cloud accounts found"}), 404

        updated_accounts = []
        for account in accounts:
            if account.provider == "Google Drive":
                new_access_token = refresh_access_token(account.refresh_token)
                if new_access_token:
                    account.access_token = new_access_token
                    account.last_synced = datetime.utcnow()
                    db.session.commit()
            elif account.provider == "Dropbox":
                new_access_token = refresh_dropbox_access_token(account.refresh_token)
                if new_access_token:
                    account.access_token = new_access_token
                    account.last_synced = datetime.utcnow()
                    db.session.commit()
            # OneDrive removed

            updated_accounts.append(account.to_dict())

        return jsonify(updated_accounts), 200

    except Exception as e:
        print(f"Error fetching cloud accounts: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# --------------------------
# Delete Cloud Storage Account
# --------------------------
@cloud_storage_bp.route("/cloud-accounts/<account_id>", methods=["DELETE"])
def delete_cloud_account(account_id):
    try:
        account = CloudStorageAccount.query.get(account_id)
        if not account:
            return jsonify({"error": "Account not found"}), 404

        db.session.delete(account)
        db.session.commit()

        return jsonify({"message": "Cloud account deleted successfully!"}), 200

    except Exception as e:
        print(f"Error deleting cloud account: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
