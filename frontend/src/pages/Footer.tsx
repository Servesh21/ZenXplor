import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white p-6 w-full">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p>© 2025 Universal File Search - All Rights Reserved</p>
        </div>
        <div className="flex gap-6">
          <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
