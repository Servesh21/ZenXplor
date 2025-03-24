import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/auth";

const Settings: React.FC = () => {
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const handleUpdateProfile = async () => {
    if (!token) return;

    const formData = new FormData();
    if (name) formData.append("name", name);
    if (profileImage) formData.append("profileImage", profileImage);

    try {
      const response = await axios.post(`${API_URL}/update-profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Profile updated successfully!");
      localStorage.setItem("profileImage", response.data.profileImage);
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-900 shadow-lg rounded-lg mt-10 transition duration-300">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Settings</h2>
      {message && <p className="text-green-600 dark:text-green-400 mb-2">{message}</p>}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Change Name</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new name"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Change Profile Image</label>
        <input
          type="file"
          className="w-full mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          accept="image/*"
          onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={handleUpdateProfile}
        className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg mt-2 hover:bg-blue-700 dark:hover:bg-blue-800 transition"
      >
        Update Profile
      </button>
    </div>
  );
};

export default Settings;