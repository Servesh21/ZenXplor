import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserProfileDropdown from "./profile/UserProfileDropdown";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Product" },
    { path: "/#features", label: "Features" },
    { path: "/#methodology", label: "Methodology" },
    { path: "/#pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface-container/70 backdrop-blur-xl shadow-[0_20px_40px_-5px_rgba(13,14,20,0.4)]">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="text-xl font-semibold tracking-[-0.02em] text-white">
          ZenXplor
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-semibold tracking-tight text-sm transition-colors duration-300 ${
                location.pathname === link.path
                  ? "text-white border-b-2 border-primary pb-1"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex gap-4 items-center">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/file-search"
                className="hidden md:inline-flex text-sm font-semibold text-[#A1A1AA] hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <UserProfileDropdown user={user} handleLogout={logout} />
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="font-semibold tracking-tight text-sm text-[#A1A1AA] hover:text-white transition-colors duration-300"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="signature-glow px-5 py-2 rounded-lg font-semibold text-on-primary-fixed text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />
          <div className="fixed top-0 left-0 h-screen w-72 bg-surface-container z-50 md:hidden shadow-2xl flex flex-col"
               style={{ animation: "slideUp 0.3s ease-out" }}>
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <span className="text-lg font-semibold text-white">ZenXplor</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} className="text-[#A1A1AA]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? "text-white bg-primary/10 border-l-2 border-primary"
                      : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t border-outline-variant/10">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="block w-full text-center signature-glow px-5 py-3 rounded-lg font-semibold text-on-primary-fixed text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              ) : (
                <Link
                  to="/file-search"
                  className="block w-full text-center signature-glow px-5 py-3 rounded-lg font-semibold text-on-primary-fixed text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Open Dashboard
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;