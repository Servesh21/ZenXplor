import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle, Settings, LogOut, Moon, HelpCircle, Sun } from "lucide-react";

const UserProfileDropdown: React.FC<{ 
  user: string | null; 
  handleLogout: () => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}> = ({ user, handleLogout, darkMode, setDarkMode }) => {

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileImage = localStorage.getItem("profileImage");
  const userEmail = localStorage.getItem("user") || "example@gmail.com";

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
    document.documentElement.classList.toggle("dark", newMode);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {user ? (
        <div className="relative" ref={dropdownRef}>
          {/* Profile Button */}
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center space-x-2 text-black dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition duration-300"
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-8 h-8 rounded-full" />
            ) : (
              <UserCircle size={24} />
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg p-4 z-50">
              {/* User Info */}
              <div className="flex items-center space-x-3 border-b pb-3">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                ) : (
                  <UserCircle size={32} className="text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="mt-3">
                <Link to="/profile" className="flex items-center px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <Settings size={18} className="mr-3" /> Edit Profile
                </Link>
                <Link to="/settings" className="flex items-center px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <Settings size={18} className="mr-3" /> Settings
                </Link>

                {/* Dark Mode Toggle */}
                <div
                  className="flex items-center justify-between px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={toggleDarkMode}
                >
                  <div className="flex items-center">
                    {darkMode ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </div>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    className="w-10 h-5 bg-gray-300 dark:bg-gray-500 rounded-full cursor-pointer"
                    readOnly
                  />
                </div>
                <Link to="/help" className="flex items-center px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <HelpCircle size={18} className="mr-3" /> Help Center
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition mt-2"
                >
                  <LogOut size={18} className="mr-3" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white transition duration-300"
        >
          Login
        </Link>
      )}
    </div>
  );
};

export default UserProfileDropdown;
