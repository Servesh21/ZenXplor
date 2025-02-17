from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from models import db, User
from flask_cors import CORS, cross_origin

# Define Blueprint
auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

def verify_token(token):
    """Verify and decode JWT token"""
    try:
        decoded_token = decode_token(token)
        return decoded_token["sub"]  # Returns user ID
    except Exception as e:
        print("Token verification failed:", str(e))
        return None

@auth_bp.after_request
def add_cors_headers(response):
    """ ✅ Ensure CORS Headers Are Set Properly """
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"  # 🔥 Required
    return response

@auth_bp.route("/signup", methods=["POST"])
@cross_origin()
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User already exists"}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials!"}), 401

    access_token = create_access_token(identity=str(user.id))
    
    print("Generated Token:", access_token)  # Debugging

    return jsonify({"message": "Login successful!", "token": access_token}), 200

@auth_bp.route("/profile", methods=["GET"])
@cross_origin()
@jwt_required()
def profile():
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"error": "Token is missing"}), 401

    token = token.replace("Bearer ", "")
    user_id = verify_token(token)

    if not user_id:
        return jsonify({"error": "Invalid token"}), 403

    return jsonify({"message": "Profile fetched successfully", "user_id": user_id}), 200
