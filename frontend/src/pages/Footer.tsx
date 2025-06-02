import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white-900 text-black p-6 w-full dark:bg-gray-900 dark:text-white shadow-md mt-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p>© 2025 Universal File Search - All Rights Reserved</p>
        </div>
        <div className="flex gap-6">
          <Link to="/terms" className="text-black hover:text-black transition-colors dark:hover:text-white dark:text-white">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-black hover:text-black transition-colors dark:hover:text-white dark:text-white">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
