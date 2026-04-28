import React, { useState, useRef, useEffect } from "react";

interface User {
  username: string;
  email: string;
  profile_picture?: string;
}

interface UserProfileDropdownProps {
  user: User;
  handleLogout: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-all shadow-lg shadow-primary/5 focus:ring-2 focus:ring-primary/20"
      >
        {user.profile_picture ? (
          <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {user.username?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-surface-container border border-outline-variant/15 rounded-xl shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden z-[100]"
             style={{ animation: "fadeIn 0.15s ease-out" }}>
          {/* User Info */}
          <div className="px-4 py-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base font-bold">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">{user.username}</p>
                <p className="text-[11px] text-on-surface-variant truncate font-mono">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <a
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </a>
            <a
              href="/storage-overview"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
              Integrations
            </a>
            <div className="my-1 border-t border-outline-variant/10"></div>
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;