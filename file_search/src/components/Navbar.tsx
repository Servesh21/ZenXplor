import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const API_URL = "http://localhost:5000/auth"; // Backend URL

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<string | null>(localStorage.getItem("user") || null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch Profile on Mount & When Token Changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      localStorage.removeItem("user");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        setUser(data.email || "User");
        localStorage.setItem("user", data.email); // ✅ Store user in localStorage
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUser(null);
        localStorage.removeItem("user");
      }
    };

    fetchProfile();
  }, [localStorage.getItem("token")]); // ✅ Re-run when token changes

  // Handle Logout
  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggingOut(false);
    navigate("/");
  };

  return (
    <nav className="relative flex items-center justify-between p-4 bg-white text-black">
      {/* Logo */}
      <div className="text-xl font-bold">Universal File Search</div>

      {/* Mobile Menu Toggle */}
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-black">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Navigation Links */}
      <div
        className={`absolute md:relative top-full left-0 w-full md:w-auto md:flex md:space-x-6 bg-white shadow-md md:shadow-none transition-all duration-300 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <Link
          to="/"
          className={`relative p-2 transition-colors ${
              location.pathname === '/'
                ? "text-blue-600 font-semibold after:w-full" // Active link styles
                : "hover:text-blue-600 after:w-0" // Default styles
            } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-300 hover:after:w-full`}
        >
          Home
        </Link>
        <Link
          to="/file-search"
          className={`relative p-2 transition-colors ${
              location.pathname === '/file-search'
                ? "text-blue-600 font-semibold after:w-full" // Active link styles
                : "hover:text-blue-600 after:w-0" // Default styles
            } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-300 hover:after:w-full`}
        >
          File Search
        </Link>
        <Link
          to="/storage-overview"
          className={`relative p-2 transition-colors ${
              location.pathname === '/storage-overview'
                ? "text-blue-600 font-semibold after:w-full" // Active link styles
                : "hover:text-blue-600 after:w-0" // Default styles
            } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-300 hover:after:w-full`}
        >
          Storage Access
        </Link>
      </div>

      {/* Desktop User Auth Controls */}
      <div className="hidden md:block">
        {user ? (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`px-4 py-2 rounded-lg border-2 ${
              isLoggingOut
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition duration-300"
            }`}
          >
            {isLoggingOut ? "Logging out..." : `Logout `}
          </button>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white transition duration-300"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
