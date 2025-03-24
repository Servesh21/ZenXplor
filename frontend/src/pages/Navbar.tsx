import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, Search, Home } from "lucide-react";
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
        setUser(data); 
        Cookies.set("access_token_cookie", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
  
    fetchProfile();
  }, [setUser]);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
  
      if (!response.ok) {
        console.error("Logout failed:", response.status);
        return;
      }
  
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="relative flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 ">
      {/* Left Section: Mobile Menu + Logo */}
      <div className="flex items-center">
        <MobileMenuToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="text-xl font-bold ml-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Universal File Search
        </div>
      </div>

      {/* Center Section: Desktop Links */}
      <div className="hidden md:flex flex-grow justify-center">
        <NavigationLinks location={location} />
      </div>

      {/* Right Section: Theme Toggle + User Profile / Login Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <UserProfileDropdown user={user} handleLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-300 text-sm font-medium"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigation 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        location={location} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    </nav>
  );
};

const MobileMenuToggle: React.FC<{ isOpen: boolean; setIsOpen: (open: boolean) => void }> = ({ isOpen, setIsOpen }) => (
  <button 
    onClick={() => setIsOpen(!isOpen)} 
    className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  >
    {isOpen ? <X size={20} /> : <Menu size={20} />}
  </button>
);

const NavigationLinks: React.FC<{ location: any }> = ({ location }) => {
  const links = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/file-search", label: "File Search", icon: <Search size={18} /> }
  ];
  
  return (
    <div className="md:flex md:space-x-1">
      {links.map(({ path, label, icon }) => (
        <Link
          key={path}
          to={path}
          className={`relative px-4 py-2 rounded-md transition-colors flex items-center space-x-2
            ${location.pathname === path 
              ? "text-blue-600 dark:text-blue-400 font-medium" 
              : "hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
        >
          {icon}
          <span>{label}</span>
          <span 
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 
              transform origin-left transition-transform duration-300 ease-out
              ${location.pathname === path ? "scale-x-100" : "scale-x-0 hover:scale-x-100"}`}
          ></span>
        </Link>
      ))}
    </div>
  );
};

const MobileNavigation: React.FC<{ 
  isOpen: boolean; 
  setIsOpen: (open: boolean) => void; 
  location: any;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}> = ({ isOpen, setIsOpen, location, darkMode, setDarkMode }) => {
  const links = [
    { path: "/", label: "Home", icon: <Home size={20} /> },
    { path: "/file-search", label: "File Search", icon: <Search size={20} /> }
  ];
  
  return (
    <>
      {/* Backdrop with fade-in effect */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{animation: "fadeIn 0.2s ease-out"}}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Universal File Search
            </div>
            <button 
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
              onClick={() => setIsOpen(false)}
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {links.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative
                    ${location.pathname === path 
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  onClick={() => setIsOpen(false)}
                >
                  {icon}
                  <span>{label}</span>
                  {location.pathname === path && (
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full"></span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;