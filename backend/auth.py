from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from flask_cors import CORS

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, supports_credentials=True, origins=["http://localhost:5173"], 
     allow_headers=["Authorization", "Content-Type"], methods=["GET", "POST", "OPTIONS"])

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User already exists"}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    print("Login Route Called")  # Debugging Step
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        print("Invalid Credentials")  # Debugging Step
        return jsonify({"error": "Invalid credentials!"}), 401

    access_token = create_access_token(identity=str(user.id))
    print(access_token)
    print("Generated Token:", access_token)  # Debugging Step
    return jsonify({"message": "Login successful!", "token": access_token}), 200

@auth_bp.route("/edit",methods=["PUT"])
def edit():
    data = request.get_json()
    email = data.get()

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()  # Extract user ID from token
    user = User.query.get(user_id)  # Fetch user from DB
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify(id=str(user.id), email=user.email,username=user.username)