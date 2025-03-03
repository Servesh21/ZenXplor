from flask import Blueprint, request, jsonify, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, verify_jwt_in_request
)
from models import db, User
from flask_cors import CORS
import re

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, supports_credentials=True, origins=["http://localhost:5173"])

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 409

    new_user = User(username=username, email=email, password=password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))  

    response = make_response(jsonify({
        "message": "Login successful!",
        "username": user.username,
        "email": user.email,
        "profile_picture": user.profile_picture,
        "access_token": access_token
    }))

    response.set_cookie(
        "user",
        access_token,
        httponly=True,
        samesite="Lax",
        secure=False
    )

    return response, 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Clears the authentication cookie."""
    response = make_response(jsonify({"message": "Logged out successfully"}))
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    """Fetch user profile details."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({"error": "Invalid or expired token"}), 401

@auth_bp.route("/edit-profile", methods=["PUT"])
@jwt_required()
def edit_profile():
    """Allows users to update their profile details."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_username = data.get("username")
    new_email = data.get("email")
    new_password = data.get("password")
    new_profile_picture = data.get("profile_picture")

    if new_username:
        if User.query.filter_by(username=new_username).first():
            return jsonify({"error": "Username already taken"}), 409
        user.username = new_username

    if new_email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({"error": "Email already in use"}), 409
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", new_email):
            return jsonify({"error": "Invalid email format"}), 400
        user.email = new_email

    if new_password:
        if len(new_password) < 8 or not re.search(r"[A-Za-z]", new_password) or not re.search(r"\d", new_password):
            return jsonify({"error": "Password must be at least 8 characters long and contain both letters and numbers."}), 400
        user.password_hash = generate_password_hash(new_password)

    if new_profile_picture:
        if not re.match(r"^https?://.*\.(png|jpg|jpeg)$", new_profile_picture, re.IGNORECASE):
            return jsonify({"error": "Profile picture must be a valid PNG or JPG URL."}), 400
        user.profile_picture = new_profile_picture

    db.session.commit()

    return jsonify({"message": "Profile updated successfully", "profile": user.to_dict()}), 200