import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/auth";

const Profile: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [user, setUser] = useState<{ email: string; username?: string; profileImage?: string } | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [token]);

  return (
    <div className={`max-w-lg mx-auto p-6 border-2 rounded-lg mt-10 ${darkMode ? "bg-gray-800 text-white border-white" : "bg-white text-gray-900 border-black"}`}>
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      {user ? (
        <div className="flex flex-col items-center">
          {user.profileImage && <img src={user.profileImage} alt="Profile" className="w-24 h-24 rounded-full mb-4" />}
          <p className="text-lg"><strong>Username:</strong> {user.username || "N/A"}</p>  {/* Fix username reference */}
          <p className="text-lg"><strong>Email:</strong> {user.email}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;