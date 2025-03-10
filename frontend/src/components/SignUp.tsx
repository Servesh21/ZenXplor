import React, { useState, useEffect } from "react";
import { FaGoogle, FaFacebook, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded } = useSignIn();

  // Google Authentication via Clerk - Unchanged logic
  const handleGoogleAuth = async () => {
    try {
      if (!signInLoaded) return;
      setIsLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/oauth-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      setError("Google Authentication Failed. Please try again.");
      console.error("Google Authentication Error:", error);
      setIsLoading(false);
    }
  };

  // Facebook Authentication via Clerk - Unchanged logic
  const handleFacebookAuth = async () => {
    try {
      if (!signInLoaded) return;
      setIsLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/oauth-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      setError("Facebook Authentication Failed. Please try again.");
      console.error("Facebook Authentication Error:", error);
      setIsLoading(false);
    }
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
        setTimeout(() => navigate("/"), 1000);
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
  
  // Handle Signup - Unchanged logic
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setIsLoading(true);
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
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>{success}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FaGoogle className="text-red-500" />
                <span className="font-medium">Google</span>
              </button>
              
              <button
                onClick={handleFacebookAuth}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FaFacebook className="text-blue-600" />
                <span className="font-medium">Facebook</span>
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
                <div className="form-group">
                  <label 
                    htmlFor="username" 
                    className={`form-label ${activeField === 'username' ? 'active-label' : ''}`}
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="form-icon">
                      <FaUser />
                    </div>
                    <input
                      id="username"
                      type="text"
                      className="form-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setActiveField('username')}
                      onBlur={() => setActiveField(null)}
                    />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label 
                  htmlFor="email" 
                  className={`form-label ${activeField === 'email' ? 'active-label' : ''}`}
                >
                  Email
                </label>
                <div className="relative">
                  <div className="form-icon">
                    <FaEnvelope />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label 
                  htmlFor="password" 
                  className={`form-label ${activeField === 'password' ? 'active-label' : ''}`}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="form-icon">
                    <FaLock />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField(null)}
                  />
                </div>
              </div>
              
              {!isLogin && (
                <div className="form-group">
                  <label 
                    htmlFor="confirmPassword" 
                    className={`form-label ${activeField === 'confirmPassword' ? 'active-label' : ''}`}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="form-icon">
                      <FaLock />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="form-input"
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
      
      <style jsx>{`
        /* Modern form styling */
        .form-group {
          position: relative;
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #4B5563;
          transition: color 0.2s ease;
        }
        
        .dark .form-label {
          color: #9CA3AF;
        }
        
        .active-label {
          color: #2563EB !important;
        }
        
        .dark .active-label {
          color: #60A5FA !important;
        }
        
        .form-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          font-size: 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          background-color: #F9FAFB;
          transition: all 0.2s ease;
          color: #1F2937;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          background-color: #FFFFFF;
        }
        
        .dark .form-input {
          background-color: rgba(30, 41, 59, 0.5);
          border-color: #374151;
          color: #F3F4F6;
        }
        
        .dark .form-input:focus {
          border-color: #3B82F6;
          background-color: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        
        .form-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          font-size: 16px;
        }
        
        /* Animation for alerts */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(10); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Auth;