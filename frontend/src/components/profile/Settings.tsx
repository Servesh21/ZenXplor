import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/auth";

const Settings: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleUpdateProfile = async () => {
    if (!token) {
      setMessage("Authentication error. Please log in again.");
      return;
    }

    if (!name && !email && !password && !profileImage) {
      setMessage("Please update at least one field.");
      return;
    }

    const formData = new FormData();
    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (password) formData.append("password", password);
    if (profileImage) formData.append("profileImage", profileImage);

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/update-profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Profile updated successfully!");
      localStorage.setItem("profileImage", response.data.profileImage);
      setName("");
      setEmail("");
      setPassword("");
      setProfileImage(null);
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg rounded-lg mt-10 transition duration-300">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      {message && <p className="text-center text-sm font-medium text-green-500 dark:text-green-400 mb-2">{message}</p>}
      
      <div className="mb-4">
        <label className="block text-sm font-medium">Change Name</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded mt-1 focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new name"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Change Email</label>
        <input
          type="email"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded mt-1 focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter new email"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Change Password</label>
        <input
          type="password"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded mt-1 focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Change Profile Image</label>
        <input
          type="file"
          className="w-full mt-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white file:cursor-pointer file:bg-blue-600 file:text-white file:px-4 file:py-2 file:border-none file:rounded-lg file:hover:bg-blue-700"
          accept="image/*"
          onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={handleUpdateProfile}
        disabled={loading}
        className={`w-full py-2 rounded-lg mt-2 transition ${loading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white'}`}
      >
        {loading ? "Updating..." : "Update Profile"}
      </button>
    </div>
  );
};

export default Settings;