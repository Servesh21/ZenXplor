import React, { useState } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import Cookies from "js-cookie";

interface User {
  username: string;
  email: string;
  profile_picture?: string;
}

interface AuthProps {
  
  setUser: (user: User | null) => void;
}

const Auth: React.FC<AuthProps> = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded } = useSignIn();

  // Google Authentication via Clerk
  const handleGoogleAuth = async () => {
    try {
      if (!signInLoaded) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/oauth-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      setError("Google Authentication Failed. Please try again.");
      console.error("Google Authentication Error:", error);
    }
  };

  // Facebook Authentication via Clerk
  const handleFacebookAuth = async () => {
    try {
      if (!signInLoaded) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/oauth-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      setError("Facebook Authentication Failed. Please try again.");
      console.error("Facebook Authentication Error:", error);
    }
  };

  // Handle Login
  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensures cookies are sent/received
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        // Ensure `setUser` receives a valid object
        setUser({ username: data.username || "", email: data.email });
  
        // Store access token explicitly
        Cookies.set("user", JSON.stringify({ username: data.username, email: data.email }), {
          expires: 7,
          secure: false,
          sameSite: "Lax",
        });
  
        navigate("/");
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
    }
  };

  // Handle Signup
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        Cookies.set("user", JSON.stringify(data.user), { expires: 7, secure: true, sameSite: "Strict" });

        setSuccess("Signup successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setError(data.error || "Signup failed.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <div className="relative p-1 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-rotate">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-[28rem] relative z-10">
          <h1 className="text-3xl font-bold text-center mb-6">
            {isLogin ? "Login to Your Account" : "Create an Account"}
          </h1>

          {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
          {success && <p className="text-green-500 text-center font-semibold">{success}</p>}

          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          <button
            onClick={isLogin ? handleLogin : handleSignup}
            className="w-full bg-blue-600 text-white p-3 mt-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300 hover:cursor-pointer"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <p className="text-center mt-6 text-lg">Or {isLogin ? "Login" : "Sign Up"} with</p>

          <div className="flex justify-center space-x-6 mt-4">
            <button onClick={handleGoogleAuth} className="oauth-button hover:cursor-pointer">
              <FaGoogle className="text-4xl" />
            </button>
            <button onClick={handleFacebookAuth} className="oauth-button hover:cursor-pointer">
              <FaFacebook className="text-4xl" />
            </button>
          </div>

          <p className="text-center mt-6 text-lg">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 cursor-pointer font-semibold hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes gradient-rotate {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-rotate {
            background-size: 300% 300%;
            animation: gradient-rotate 6s ease infinite;
          }
          .input-field {
            border: 1px solid #ccc;
            padding: 12px;
            width: 100%;
            margin-top: 10px;
            border-radius: 6px;
            background-color: #f7f7f7;
          }
          .oauth-button {
            padding: 16px;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
        `}
      </style>
    </div>
  );
};

export default Auth;