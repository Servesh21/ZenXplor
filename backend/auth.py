from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from flask_cors import CORS

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, supports_credentials=True, origins=["http://localhost:5173"], 
     allow_headers=["Authorization", "Content-Type"], methods=["GET", "POST", "PUT", "OPTIONS"])

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

    new_user = User(username=username, email=email, password=password)  # Pass raw password
    
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
    return jsonify({
        "message": "Login successful!",
        "token": access_token,
        "username": user.username,  # Send username in response
        "email": user.email
    }), 200


@auth_bp.route("/edit", methods=["PUT"])
@jwt_required()
def edit():
    """ Allows users to edit their username or email """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_username = data.get("username")
    new_email = data.get("email")

    if new_username:
        user.username = new_username
    
    if new_email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({"error": "Email already in use"}), 409
        user.email = new_email

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    """ Retrieves user profile based on JWT token """
    user_id = get_jwt_identity()
    print("Decoded user_id from JWT:", user_id)  # Debugging log

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email
    }), 200