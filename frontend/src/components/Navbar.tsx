import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import UserProfileDropdown from "./profile/UserProfileDropdown";

const API_URL = "http://localhost:5000/auth";

const Navbar: React.FC<{ darkMode: boolean; setDarkMode: (mode: boolean) => void }> = ({ darkMode, setDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<string | null>(localStorage.getItem("user"));

  // Apply dark mode globally
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("profileImage");
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
        localStorage.setItem("user", data.email);

        if (data.profileImage) {
          localStorage.setItem("profileImage", data.profileImage);
        } else {
          localStorage.removeItem("profileImage");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("profileImage");
      }
    };

    fetchProfile();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setTimeout(() => navigate("/"), 100);
  };

  return (
    <nav className="relative flex items-center justify-between p-4 bg-white dark:bg-gray-900  text-black dark:text-white">
      {/* Left Section: Mobile Menu + Title */}
      <div className="flex items-center">
        <MobileMenuToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="text-xl font-bold ml-4">Universal File Search</div>
      </div>

      {/* Center Section: Desktop Links */}
      <div className="hidden md:flex flex-grow justify-center">
        <NavigationLinks location={location} />
      </div>

      {/* Right Section: User Profile / Login Button */}
      <div className="flex items-center space-x-4">
        {user ? (
          <UserProfileDropdown user={user} handleLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white transition duration-300"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigation isOpen={isOpen} setIsOpen={setIsOpen} location={location} />
    </nav>
  );
};

const MobileMenuToggle: React.FC<{ isOpen: boolean; setIsOpen: (open: boolean) => void }> = ({ isOpen, setIsOpen }) => (
  <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-black dark:text-white">
    {isOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
);

const NavigationLinks: React.FC<{ location: any }> = ({ location }) => (
  <div className="md:flex md:space-x-6">
    {["/", "/file-search", "/storage-overview"].map((path) => (
      <Link
        key={path}
        to={path}
        className={`relative p-2 transition-colors hidden md:block
          ${location.pathname === path ? "text-blue-600 dark:text-blue-400 font-semibold" : "hover:text-blue-600 dark:hover:text-blue-400"}
          after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400
          after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 
          ${location.pathname === path ? "after:scale-x-100" : ""}`}>
        {path === "/" ? "Home" : path === "/file-search" ? "File Search" : "Storage Access"}
      </Link>
    ))}
  </div>
);

const MobileNavigation: React.FC<{ isOpen: boolean; setIsOpen: (open: boolean) => void; location: any }> = ({ isOpen, setIsOpen, location }) => (
  <div
    className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 shadow-md transform transition-transform duration-300 z-50 
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
    <button className="absolute top-4 right-4 md:hidden" onClick={() => setIsOpen(false)}>
      <X size={24} className="text-black dark:text-white" />
    </button>
    <div className="flex flex-col items-start mt-16 space-y-4">
      {["/", "/file-search", "/storage-overview"].map((path) => (
        <Link
          key={path}
          to={path}
          className="block w-full px-6 py-3 text-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={() => setIsOpen(false)}
        >
          {path === "/" ? "Home" : path === "/file-search" ? "File Search" : "Storage Access"}
        </Link>
      ))}
    </div>
  </div>
);

export default Navbar;