import os
import string
import logging
import threading
import time
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify, redirect, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
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

# Base URLs from environment variables
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# Google OAuth Credentials (unchanged)
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = f"{BACKEND_URL}/cloud-storage/callback"
FRONTEND_REDIRECT_URI = f"{FRONTEND_URL}/storage-overview"
TOKEN_URL = "https://oauth2.googleapis.com/token"

# Dropbox OAuth Credentials
DROPBOX_CLIENT_ID = os.getenv("DROPBOX_CLIENT_ID")
DROPBOX_CLIENT_SECRET = os.getenv("DROPBOX_CLIENT_SECRET")
DROPBOX_REDIRECT_URI = f"{BACKEND_URL}/cloud-storage/dropbox/callback"
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
# Note: These callbacks do NOT use @jwt_required because cookies are often
# lost during cross-domain OAuth redirects (Google → Backend → Frontend).
# Instead, the frontend passes the user_id via the OAuth `state` parameter,
# and the backend verifies it using a signed JWT state token.

import jwt as pyjwt

def _create_oauth_state(user_id: str) -> str:
    """Create a signed state token containing the user_id."""
    secret = os.getenv("SECRET_KEY", "zenxplor-secret-key")
    return pyjwt.encode({"user_id": user_id}, secret, algorithm="HS256")

def _decode_oauth_state(state: str):
    """Decode the state token and return user_id."""
    secret = os.getenv("SECRET_KEY", "zenxplor-secret-key")
    try:
        payload = pyjwt.decode(state, secret, algorithms=["HS256"])
        return payload.get("user_id")
    except Exception:
        return None

# Endpoint for frontend to get a signed state token before OAuth redirect
@cloud_storage_bp.route("/cloud-storage/oauth-state", methods=["GET"])
@jwt_required()
def get_oauth_state():
    user_id = get_jwt_identity()
    state = _create_oauth_state(user_id)
    return jsonify({"state": state}), 200

@cloud_storage_bp.route("/cloud-storage/callback", methods=["GET"])
def google_callback():
    code = request.args.get("code")
    state = request.args.get("state")
    if not code:
        return jsonify({"error": "Authorization code not found"}), 400

    # Try to get user_id from state param first, then fall back to JWT cookie
    user_id = None
    if state:
        user_id = _decode_oauth_state(state)
    if not user_id:
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
        except Exception:
            pass
    if not user_id:
        return redirect(f"{FRONTEND_REDIRECT_URI}?status=error&message=auth_required")

    from flask import url_for
    redirect_uri_dynamic = url_for("cloud_storage.google_callback", _external=True)
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": redirect_uri_dynamic,
        "grant_type": "authorization_code",
    }
    response = requests.post(TOKEN_URL, data=data)
    tokens = response.json()
    print("Google Tokens:", tokens)

    if "access_token" not in tokens or "refresh_token" not in tokens:
        return redirect(f"{FRONTEND_REDIRECT_URI}?status=error&message=token_failed")

    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    user_info = requests.get(user_info_url, headers=headers).json()
    print("Google User Info:", user_info)
    email = user_info.get("email")
    if not email:
        return redirect(f"{FRONTEND_REDIRECT_URI}?status=error&message=no_email")

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
    frontend_redirect_url = f"{FRONTEND_REDIRECT_URI}?status=success&email={email}"
    return redirect(frontend_redirect_url)

@cloud_storage_bp.route("/cloud-storage/dropbox/callback", methods=["GET"])
def dropbox_callback():
    code = request.args.get("code")
    state = request.args.get("state")
    if not code:
        return jsonify({"error": "Authorization code not found"}), 400

    # Try to get user_id from state param first, then fall back to JWT cookie
    user_id = None
    if state:
        user_id = _decode_oauth_state(state)
    if not user_id:
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
        except Exception:
            pass
    if not user_id:
        return redirect(f"{FRONTEND_REDIRECT_URI}?status=error&message=auth_required")

    print("Client ID:", DROPBOX_CLIENT_ID)
    from flask import url_for
    redirect_uri_dynamic = url_for("cloud_storage.dropbox_callback", _external=True)
    data = {
        "code": code,
        "client_id": DROPBOX_CLIENT_ID,
        "client_secret": DROPBOX_CLIENT_SECRET,
        "redirect_uri": redirect_uri_dynamic,
        "grant_type": "authorization_code",
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(DROPBOX_TOKEN_URL, data=data, headers=headers)
    tokens = response.json()
    print("Dropbox Tokens:", tokens)

    if "access_token" not in tokens:
        return redirect(f"{FRONTEND_REDIRECT_URI}?status=error&message=token_failed")

    # Get user info from Dropbox
    user_info_url = "https://api.dropboxapi.com/2/users/get_current_account"
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    user_info = requests.post(user_info_url, headers=headers).json()
    print("Dropbox User Info:", user_info)
    email = user_info.get("email")
    if not email:
        return redirect(f"{FRONTEND_REDIRECT_URI}?status=error&message=no_email")

    existing_account = CloudStorageAccount.query.filter_by(user_id=user_id, email=email, provider="Dropbox").first()
    if existing_account:
        existing_account.access_token = tokens["access_token"]
        existing_account.last_synced = datetime.utcnow()
    else:
        new_account = CloudStorageAccount(
            user_id=user_id,
            provider="Dropbox",
            email=email,
            permissions="Read files, Search files",
            access_token=tokens["access_token"],
            last_synced=datetime.utcnow()
        )
        db.session.add(new_account)

    db.session.commit()
    frontend_redirect_url = f"{FRONTEND_REDIRECT_URI}?status=success&email={email}"
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
        # Fetch the cloud account
        account = CloudStorageAccount.query.get(account_id)
        if not account:
            return jsonify({"error": "Account not found"}), 404

        # Delete all files associated with this cloud account
        IndexedFile.query.filter_by(account_id=account_id).delete()

        # Delete the cloud account itself
        db.session.delete(account)
        db.session.commit()

        return jsonify({"message": "Cloud account and related indexed files deleted successfully!"}), 200

    except Exception as e:
        print(f"Error deleting cloud account: {e}")
        db.session.rollback()
        return jsonify({"error": "Internal Server Error"}), 500