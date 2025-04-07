import React, { useState, useEffect } from "react";
import { FaGoogle, FaGithub, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const navigate = useNavigate();


  // Helper functions for validation
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  // Google Authentication via Clerk - Unchanged logic
  const handleGoogleOAuth = () => {
    setIsLoading(true);
    window.location.href = "http://localhost:5000/auth/login/google";
  };

  const handleGithubOAuth = () => {
    setIsLoading(true);
    window.location.href = "http://localhost:5000/auth/login/github";
  };
  // Handle Login - Unchanged logic
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setUser({ 
          username: data.username, 
          email: data.email, 
          profile_picture: data.profile_picture || ""
        });
  
        Cookies.set("access_token_cookie", JSON.stringify({ 
          username: data.username, 
          email: data.email, 
          profile_picture: data.profile_picture || "" 
        }), { expires: 7, secure: false, sameSite: "Lax" });
  
        setSuccess("Login successful!");
        setTimeout(() => navigate("/storage-overview"), 1000);
      } else {
        setError(data.error || "Invalid email or password.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Handle Signup with Direct Login, with added validation
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email format.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long.");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",  // Ensure cookies are sent/received
        body: JSON.stringify({ username, email, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setSuccess("Signup successful! Logging you in...");
        setTimeout(() => navigate("/storage-overview"), 1500);
      } else {
        setError(data.error || "Signup failed.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Clear errors/success when switching modes
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [isLogin]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl">
        {/* Left Side - Illustration/Brand */}
        <div className="lg:w-1/2 bg-blue-600 dark:bg-blue-800 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {/* Abstract Pattern Overlay */}
            <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 100 Q 50 80 100 100 T 200 100 T 300 100 T 400 100 T 500 100 T 600 100 T 700 100 T 800 100 V 0 H 0 Z" fill="currentColor" />
              <path d="M 0 300 Q 50 280 100 300 T 200 300 T 300 300 T 400 300 T 500 300 T 600 300 T 700 300 T 800 300 V 200 H 0 Z" fill="currentColor" />
              <path d="M 0 500 Q 50 480 100 500 T 200 500 T 300 500 T 400 500 T 500 500 T 600 500 T 700 500 T 800 500 V 400 H 0 Z" fill="currentColor" />
              <path d="M 0 700 Q 50 680 100 700 T 200 700 T 300 700 T 400 700 T 500 700 T 600 700 T 700 700 T 800 700 V 600 H 0 Z" fill="currentColor" />
            </svg>
          </div>
          
          <div className="z-10 mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Universal File Search</h1>
            <p className="text-blue-200 text-lg">Search your files across desktop and cloud, all in one place</p>
          </div>
          
          <div className="z-10">
            <h2 className="text-3xl font-bold text-white mb-6">
              {isLogin ? "Welcome back!" : "Join our community"}
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              {isLogin 
                ? "Sign in to access your account and continue your journey with us."
                : "Create an account to get started and explore all the features we offer."}
            </p>
            
            <div className="mt-12 space-y-4">
              <div className="flex items-center text-blue-100">
                <div className="mr-4 p-2 bg-blue-500 bg-opacity-30 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <span>Simple and secure login</span>
              </div>
              
              <div className="flex items-center text-blue-100">
                <div className="mr-4 p-2 bg-blue-500 bg-opacity-30 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <span>Personalized dashboard</span>
              </div>
              
              <div className="flex items-center text-blue-100">
                <div className="mr-4 p-2 bg-blue-500 bg-opacity-30 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <span>Premium features available</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="lg:w-1/2 bg-white dark:bg-gray-800 p-8 lg:p-16">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {isLogin ? "Sign in" : "Create account"}
            </h3>
            <div className="flex space-x-1 text-sm font-medium">
              <button 
                onClick={() => setIsLogin(true)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  isLogin 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300'
                }`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  !isLogin 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300'
                }`}
              >
                Register
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>{success}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleOAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <FaGoogle className="text-red-500" />
                <span className="font-medium">Google</span>
              </button>
              
              <button
              onClick={handleGithubOAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <FaGithub className="text-white-500 " />
                <span className="font-medium">Github</span>
              </button>
            </div>
            
            <div className="flex items-center">
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or continue with email</span>
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
              {!isLogin && (
                <div className="relative mb-5">
                  <label 
                    htmlFor="username" 
                    className={`block text-sm font-medium mb-1.5 ${
                      activeField === 'username' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaUser />
                    </div>
                    <input
                      id="username"
                      type="text"
                      className={`w-full pl-10 pr-3 py-2.5 text-base rounded-lg border ${
                        activeField === 'username'
                          ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-gray-900'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                      } focus:outline-none transition-all duration-200 text-gray-900 dark:text-gray-100`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setActiveField('username')}
                      onBlur={() => setActiveField(null)}
                    />
                  </div>
                </div>
              )}
              
              <div className="relative mb-5">
                <label 
                  htmlFor="email" 
                  className={`block text-sm font-medium mb-1.5 ${
                    activeField === 'email' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaEnvelope />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`w-full pl-10 pr-3 py-2.5 text-base rounded-lg border ${
                      activeField === 'email'
                        ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-gray-900'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                    } focus:outline-none transition-all duration-200 text-gray-900 dark:text-gray-100`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                  />
                </div>
              </div>
              
              <div className="relative mb-5">
                <label 
                  htmlFor="password" 
                  className={`block text-sm font-medium mb-1.5 ${
                    activeField === 'password' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className={`w-full pl-10 pr-3 py-2.5 text-base rounded-lg border ${
                      activeField === 'password'
                        ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-gray-900'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                    } focus:outline-none transition-all duration-200 text-gray-900 dark:text-gray-100`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField(null)}
                  />
                </div>
              </div>
              
              {!isLogin && (
                <div className="relative mb-5">
                  <label 
                    htmlFor="confirmPassword" 
                    className={`block text-sm font-medium mb-1.5 ${
                      activeField === 'confirmPassword' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaLock />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`w-full pl-10 pr-3 py-2.5 text-base rounded-lg border ${
                        activeField === 'confirmPassword'
                          ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-gray-900'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                      } focus:outline-none transition-all duration-200 text-gray-900 dark:text-gray-100`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setActiveField('confirmPassword')}
                      onBlur={() => setActiveField(null)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {isLogin && (
              <div className="flex justify-end">
                <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Forgot password?
                </button>
              </div>
            )}
            
            <button
              onClick={isLogin ? handleLogin : handleSignup}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-colors relative overflow-hidden"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {isLogin ? "Sign in" : "Create account"}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
              )}
            </button>
          </div>
          
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            By {isLogin ? "signing in" : "creating an account"}, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
