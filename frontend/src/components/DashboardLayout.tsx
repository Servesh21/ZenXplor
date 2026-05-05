import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaDesktop } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import CommandPalette from "./CommandPalette";

interface DashboardLayoutProps {
  children: React.ReactNode;
  agentRunning?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, agentRunning = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Global Ctrl+K / ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const sidebarLinks = [
    { path: "/home", icon: "home", label: "Home" },
    { path: "/file-search", icon: "search", label: "Search" },
    { path: "/storage-overview", icon: "sync_alt", label: "Integrations" },
    { path: "/settings", icon: "settings", label: "Settings" },
  ];

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="mb-10 px-2">
        <Link to="/" className="block">
          <h1 className="text-xl font-semibold tracking-tighter text-slate-100 flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              deployed_code
            </span>
            ZenXplor
          </h1>
          <p className="text-[10px] uppercase tracking-[1.5px] text-slate-500 mt-1 font-mono">
            Midnight Architect
          </p>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {sidebarLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-all duration-200 ${
              isActive(link.path)
                ? "text-slate-100 bg-surface-container-high font-medium border-l-2 border-primary ml-0 shadow-[inset_0_0_20px_rgba(196,192,255,0.03)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-container-high/50 border-l-2 border-transparent"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-colors ${
                isActive(link.path) ? "text-primary" : "group-hover:text-primary/60"
              }`}
            >
              {link.icon}
            </span>
            <span className="text-sm">{link.label}</span>
            {isActive(link.path) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_#c4c0ff]" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto pt-6 space-y-3 border-t border-outline-variant/10">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-outline-variant/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 rounded-lg w-full"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] h-screen fixed left-0 top-0 bg-surface-container flex-col py-6 px-4 z-50 border-r border-outline-variant/5">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-surface-container/95 backdrop-blur-xl flex items-center justify-between px-4 border-b border-outline-variant/10">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface text-[22px]">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
        <Link to="/" className="text-base font-semibold tracking-tighter text-slate-100 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>deployed_code</span>
          ZenXplor
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              agentRunning
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-red-400 shadow-[0_0_8px_#f87171]"
            }`}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />
          <aside
            className="md:hidden fixed left-0 top-0 h-screen w-[260px] bg-surface-container z-[70] flex flex-col py-6 px-4 shadow-2xl"
            style={{ animation: "slideUp 0.25s ease-out" }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Top Bar (Desktop) */}
      <header className="hidden md:flex fixed top-0 right-0 w-[calc(100%-220px)] h-14 z-40 bg-surface/70 backdrop-blur-xl items-center justify-between px-8 border-b border-outline-variant/5">
        <button
          onClick={() => setCmdPaletteOpen(true)}
          className="flex items-center gap-4 text-slate-500 hover:text-slate-300 transition-colors group cursor-pointer bg-transparent border-none"
        >
          <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">search</span>
          <span className="text-xs font-mono opacity-50 tracking-widest group-hover:opacity-80 transition-opacity">⌘K TO EXPLORE</span>
        </button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high/50 text-sm border border-outline-variant/10">
            <FaDesktop size={12} className="text-slate-400" />
            <span
              className={`w-2 h-2 rounded-full ${
                agentRunning
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-red-400 shadow-[0_0_8px_#f87171]"
              }`}
            />
            <span className="text-[11px] font-medium text-slate-400 tracking-wider">
              {agentRunning ? "Agent Online" : "No Agent"}
            </span>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} agentRunning={agentRunning} />

      {/* Main Content */}
      <main className="md:ml-[220px] pt-14 min-h-screen">{children}</main>

      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/3 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] left-[-15%] w-[40%] h-[60%] bg-indigo-500/3 blur-[150px] rounded-full"></div>
      </div>
    </div>
  );
};

export default DashboardLayout;
