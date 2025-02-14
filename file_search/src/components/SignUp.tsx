import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa"; // Google Logo
import { FaFacebook } from "react-icons/fa"; // Facebook Logo

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true); // Default to Login

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 text-black">
      <div className="relative p-1 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-rotate">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-[28rem] relative z-10">
          <h1 className="text-3xl font-bold text-center mb-6">
            {isLogin ? "Login to Your Account" : "Create an Account"}
          </h1>

          <input
            type="email"
            placeholder="Email"
            className="border p-3 w-full mt-4 rounded-lg text-lg"
          />

          <input
            type="password"
            placeholder="Password"
            className="border p-3 w-full mt-4 rounded-lg text-lg"
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="border p-3 w-full mt-4 rounded-lg text-lg"
            />
          )}

          <button className="w-full bg-blue-600 text-white p-3 mt-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300">
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <p className="text-center mt-6 text-lg">
            Or {isLogin ? "Login" : "Sign Up"} with
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <button className="p-3 rounded-lg w-16 h-16 flex items-center justify-center transition hover:text-red-500 text-gray-500">
              <FaGoogle className="text-4xl" />
            </button>
            <button className="p-3 rounded-lg w-16 h-16 flex items-center justify-center transition hover:text-blue-600 text-gray-500">
              <FaFacebook className="text-4xl" />
            </button>
          </div>

          <p className="text-center mt-6 text-lg">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={() => setIsLogin(!isLogin)}
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
