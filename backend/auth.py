from flask import Blueprint, request, jsonify, make_response, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import os
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, verify_jwt_in_request
)
from models import db, User
from flask_cors import CORS
from file_search import start_auto_sync_threads

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, supports_credentials=True)

# Predefined profile pictures
PREDEFINED_PROFILE_PICTURES = [
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown"
]
from authlib.integrations.flask_client import OAuth
from flask import redirect, url_for, session
import uuid

oauth = OAuth(current_app)

# Register OAuth apps
oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)


oauth.register(
    name='github',
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    userinfo_endpoint='https://api.github.com/user',
    client_kwargs={'scope': 'user:email'},
)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    profile_picture = data.get("profile_picture", PREDEFINED_PROFILE_PICTURES[0])

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 409

    if profile_picture not in PREDEFINED_PROFILE_PICTURES:
        return jsonify({"error": "Invalid profile picture selection"}), 400

    try:
        new_user = User(username=username, email=email, password=password, profile_picture=profile_picture)
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create user", "details": str(e)}), 500

    # Automatically log in the user after successful signup:
    access_token = create_access_token(identity=str(new_user.id))
    response = make_response(jsonify({
        "message": "User created successfully",
        "user": new_user.to_dict()
    }), 201)
    response.set_cookie(
        "access_token_cookie", 
        access_token, 
        httponly=True, 
        samesite="Lax", 
        secure=False,  # Change to True in production (HTTPS)
        max_age=7 * 24 * 60 * 60  # 7 days in seconds
    )
    return response
 

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
        "access_token_cookie", access_token, httponly=True, samesite="Lax", secure=False,max_age=7 * 24 * 60 * 60 
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

        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "profile_picture": user.profile_picture
        }), 200
    except Exception as e:
        print(f"Profile error: {str(e)}")
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
        password = data.get("password")
        profile_picture = data.get("profile_picture", user.profile_picture)

        user.username = username
        user.email = email

        if password:
            user.password_hash = generate_password_hash(password)

        if profile_picture not in PREDEFINED_PROFILE_PICTURES:
            return jsonify({"error": "Invalid profile picture selection"}), 400

        user.profile_picture = profile_picture

        db.session.commit()
        return jsonify({"message": "Profile updated successfully!", "user": user.to_dict()}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred", "details": str(e)}), 500
    


@auth_bp.route("/login/google")
def login_google():
    redirect_uri = url_for("auth.authorize_google", _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route("/authorize/google")
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { sign } from 'jsonwebtoken';
import { User } from './models/user';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173/storage-overview';
const PREDEFINED_PROFILE_PICTURES = ['default_profile.png']; // Replace with actual values

const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

interface GoogleUserResult {
    email: string;
    name?: string;
    picture?: string;
}

export const authorizeGoogle = async (req: Request, res: Response) => {
    const { tokens } = await oauth2Client.getToken(req.body.code);
    oauth2Client.setCredentials(tokens);

    const googleUser = await oauth2Client.request<GoogleUserResult>({
        url: 'https://www.googleapis.com/oauth2/v1/userinfo'
    });

    const { email, name, picture } = googleUser.data;

    if (!email) {
        return res.status(400).send('Email not found in Google profile.');
    }

    let user = await User.findOne({ email });

    if (!user) {
        const username = name || email.split('@')[0];
        user = await User.create({
            username,
            email,
            password: uuidv4(),
            profile_picture: picture || PREDEFINED_PROFILE_PICTURES[0]
        });
    }

    const accessToken = sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('access_token_cookie', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false // Set to true in production with HTTPS
    });

    res.redirect(FRONTEND_URL);
};


@auth_bp.route("/login/github")
def login_github():
    redirect_uri = url_for("auth.authorize_github", _external=True)
    return oauth.github.authorize_redirect(redirect_uri)

@auth_bp.route("/authorize/github")
def authorize_github():
    token = oauth.github.authorize_access_token()
    user_info = oauth.github.get("user").json()
    email_resp = oauth.github.get("user/emails").json()
    email = next((e["email"] for e in email_resp if e["primary"]), None)

    username = user_info.get("login")
    picture = user_info.get("avatar_url")

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            username=username,
            email=email,
            password=str(uuid.uuid4()),  # random dummy password
            profile_picture=picture or PREDEFINED_PROFILE_PICTURES[0]
        )
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    response = make_response(redirect("http://localhost:5173/storage-overview"))  # Adjust frontend URL
    response.set_cookie("access_token_cookie", access_token, httponly=True, samesite="Lax", secure=False)
    return response

@auth_bp.route("/check-auth", methods=["GET"])
def check_auth():
    try:
        verify_jwt_in_request()  # Checks the JWT in cookie
        user_id = get_jwt_identity()

        user = User.query.get(user_id)
        if not user:
            return jsonify({"authenticated": False}), 200

        return jsonify({
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "profile_picture": user.profile_picture
            }
        }), 200
    except Exception as e:
        print("Auth check error:", e)
        return jsonify({"authenticated": False}), 200

