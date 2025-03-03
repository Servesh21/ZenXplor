import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Cookies from "js-cookie";
import UserProfileDropdown from "./profile/UserProfileDropdown";

interface User {
  username: string;
  email: string;
  profile_picture?: string;
}

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser, darkMode, setDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Apply dark mode globally
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/profile", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Unauthorized:", response.status);
          setUser(null);
          return;
        }

        const data: User = await response.json();
       

        setUser(data); // ✅ Set user from API response
        Cookies.set("user", JSON.stringify(data)); // ✅ Store user in cookies as JSON string
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [setUser]);

  const handleLogout = () => {
    Cookies.remove("user");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="relative flex items-center justify-between p-4 bg-white dark:bg-gray-900 text-black dark:text-white">
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
    {["/", "/file-search"].map((path) => (
      <Link
        key={path}
        to={path}
        className={`relative p-2 transition-colors hidden md:block
          ${location.pathname === path ? "text-blue-600 dark:text-blue-400 font-semibold" : "hover:text-blue-600 dark:hover:text-blue-400"}
          after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400
          after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 
          ${location.pathname === path ? "after:scale-x-100" : ""}`}>
        {path === "/" ? "Home" : "File Search"}
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
      {["/", "/file-search"].map((path) => (
        <Link
          key={path}
          to={path}
          className="block w-full px-6 py-3 text-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={() => setIsOpen(false)}
        >
          {path === "/" ? "Home" : "File Search"}
        </Link>
      ))}
    </div>
  </div>
);

export default Navbar;