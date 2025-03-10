from flask import Blueprint, request, jsonify, make_response, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import os
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, verify_jwt_in_request
)
from models import db, User
from flask_cors import CORS

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, supports_credentials=True, origins=["http://localhost:5173"])

# Predefined profile pictures
PREDEFINED_PROFILE_PICTURES = [
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown"
]

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    profile_picture = data.get("profile_picture", PREDEFINED_PROFILE_PICTURES[0])  # Default avatar

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 409

    if profile_picture not in PREDEFINED_PROFILE_PICTURES:
        return jsonify({"error": "Invalid profile picture selection"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password_hash=hashed_password, profile_picture=profile_picture)

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
        "access_token_cookie", access_token, httponly=True, samesite="Lax", secure=False
    )

    return response, 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    response = make_response(jsonify({"message": "Logged out successfully"}))
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.to_dict()), 200
    except Exception:
        return jsonify({"error": "Invalid or expired token"}), 401

@auth_bp.route("/edit-profile", methods=["PUT"])
@jwt_required()
def edit_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        username = data.get("username", user.username)
        email = data.get("email", user.email)
        password = data.get("password", None)
        profile_picture = data.get("profile_picture", user.profile_picture)

        user.username = username
        user.email = email

        if password:
            user.password_hash = generate_password_hash(password)

        # Ensure profile picture is only from predefined options
        if profile_picture in PREDEFINED_PROFILE_PICTURES:
            user.profile_picture = profile_picture
        else:
            return jsonify({"error": "Invalid profile picture selection"}), 400

        db.session.commit()
        return jsonify({"message": "Profile updated successfully!", "user": user.to_dict()}), 200
    
    except Exception as e:
        print("Error:", e)  # Print the error to the Flask console
        return jsonify({"error": "An error occurred", "details": str(e)}), 500