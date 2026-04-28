import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest w-full py-12 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-8 md:mb-0">
          <div className="text-lg font-bold text-white">ZenXplor</div>
          <p className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#71717A]">
            © 2025 ZenXplor. Precision in Architecture.
          </p>
        </div>
        <div className="flex gap-8">
          <Link
            to="/privacy"
            className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#71717A] hover:text-white transition-colors opacity-80 hover:opacity-100"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#71717A] hover:text-white transition-colors opacity-80 hover:opacity-100"
          >
            Terms of Service
          </Link>
          <a
            href="https://github.com/Servesh21/file_search1"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#71717A] hover:text-white transition-colors opacity-80 hover:opacity-100"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
