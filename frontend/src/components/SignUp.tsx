import React, { useState } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa"; // Social Icons
import { useNavigate } from "react-router-dom"; 
import { useSignIn } from "@clerk/clerk-react"; // Clerk Auth

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>(""); // Added username
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded } = useSignIn();

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

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username); // Store username
        localStorage.setItem("userEmail", data.email);   // Store email if needed
        navigate("/");
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
    }
  };
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Signup successful! Please log in.");
        setIsLogin(true);
      } else {
        setError(data.error || "Signup failed.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 text-black">
      <div className="relative p-1 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-rotate">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-[28rem] relative z-10">
          <h1 className="text-3xl font-bold text-center mb-6">
            {isLogin ? "Login to Your Account" : "Create an Account"}
          </h1>

          {error && <p className="text-red-500 text-center font-semibold">{error}</p>}

          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="border p-3 w-full mt-4 rounded-lg text-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="border p-3 w-full mt-4 rounded-lg text-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="border p-3 w-full mt-4 rounded-lg text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="border p-3 w-full mt-4 rounded-lg text-lg"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          <button
            onClick={isLogin ? handleLogin : handleSignup}
            className="w-full bg-blue-600 text-white p-3 mt-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <p className="text-center mt-6 text-lg">Or {isLogin ? "Login" : "Sign Up"} with</p>

          <div className="flex justify-center space-x-6 mt-4">
            <button
              onClick={handleGoogleAuth}
              className="p-3 rounded-lg w-16 h-16 flex items-center justify-center transition hover:text-red-500 text-gray-500"
            >
              <FaGoogle className="text-4xl" />
            </button>
            <button className="p-3 rounded-lg w-16 h-16 flex items-center justify-center transition hover:text-blue-600 text-gray-500">
              <FaFacebook className="text-4xl" />
            </button>
          </div>

          <p className="text-center mt-6 text-lg">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError(""); // Clear error when switching
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
        `}
      </style>
    </div>
  );
};

export default Auth;
