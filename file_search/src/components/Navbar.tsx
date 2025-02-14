import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Import icons for menu toggle

interface NavItem {
  to: string;
  label: string;
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: "/", label: "Home" },
    { to: "/file-search", label: "File Search" },
    { to: "/storage-overview", label: "Storage Access" },
  ];

  return (
    <nav className="relative flex items-center justify-between p-4 bg-white  text-black">
      {/* Logo */}
      <div className="text-xl font-bold">Universal File Search</div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-black"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop & Mobile Navigation */}
      <div
        className={`absolute md:relative top-full left-0 w-full md:w-auto md:flex md:space-x-6 bg-white shadow-md md:shadow-none transition-all duration-300 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        {navItems.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`block p-2 md:inline-block relative transition-colors ${
              location.pathname === to
                ? "text-blue-600 font-semibold after:w-full"
                : "hover:text-blue-600 after:w-0"
            } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Login Button */}
      <Link
        to="/login"
        className="hidden md:block px-4 py-2  rounded-lg border-2 border-blue-700 hover:text-white hover:bg-blue-700  transition duration-300"
      >
        Login
      </Link>
    </nav>
  );
};

export default Navbar;
