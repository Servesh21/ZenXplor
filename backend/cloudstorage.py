import requests
from flask import Blueprint, request, jsonify, redirect
from datetime import datetime
from models import db, CloudStorageAccount
from flask_jwt_extended import jwt_required, get_jwt_identity
from jwt import decode , exceptions
from dotenv import load_dotenv
load_dotenv()
cloud_storage_bp = Blueprint("cloud_storage", __name__)



# Google OAuth Credentials
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

REDIRECT_URI = "http://localhost:5000/cloud-storage/callback"
FRONTEND_REDIRECT_URI = "http://localhost:5173/storage-overview"
TOKEN_URL = "https://oauth2.googleapis.com/token"


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
        return None  # Failed to refresh token
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return None




@cloud_storage_bp.route("/cloud-storage/callback", methods=["GET"])
@jwt_required()
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Authorization code not found"}), 400

    # Exchange code for tokens
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post(TOKEN_URL, data=data)
    tokens = response.json()

    print("Tokens:", tokens)  # Debugging

    if "access_token" not in tokens or "refresh_token" not in tokens:
        return jsonify({"error": "Failed to retrieve tokens", "details": tokens}), 400

    # ✅ Extract email from ID token (if available)
    email = None
    # ✅ Fallback: Fetch user info via API if email is missing
    if not email:
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        user_info = requests.get(user_info_url, headers=headers).json()
        print("User Info Response:", user_info)  # Debugging
        email = user_info.get("email")

    if not email:
        return jsonify({"error": "Failed to retrieve email"}), 400

    # ✅ Ensure user is authenticated
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    # ✅ Check if this email is already linked for this user
    existing_account = CloudStorageAccount.query.filter_by(user_id=user_id, email=email, provider="Google Drive").first()

    if existing_account:
        # Update existing account tokens
        existing_account.access_token = tokens["access_token"]
        existing_account.refresh_token = tokens["refresh_token"]
        existing_account.last_synced = datetime.utcnow()
    else:
        # Create a new account entry
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

    # ✅ Redirect to frontend with success message
    frontend_redirect_url = f"{FRONTEND_REDIRECT_URI}?status=success&email={email}"
    return redirect(frontend_redirect_url)

# ✅ Fetch connected cloud storage accounts & Auto-Refresh Access Token
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

            updated_accounts.append(account.to_dict())

        return jsonify(updated_accounts), 200

    except Exception as e:
        print(f"Error fetching cloud accounts: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


# ✅ Delete a cloud storage account
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
