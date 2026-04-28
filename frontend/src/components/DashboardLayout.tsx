import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDesktop } from 'react-icons/fa';

interface DashboardLayoutProps {
  children: React.ReactNode;
  agentRunning?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, agentRunning = false }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-[#0d0e14] text-[#e3e1ea] font-body selection:bg-primary/30 min-h-screen">
      {/* SideNavBar Component */}
      <aside className="w-[220px] h-screen fixed left-0 top-0 bg-slate-900 dark:bg-[#1E1F26] flex flex-col py-6 px-4 z-50">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-semibold tracking-tighter text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">deployed_code</span> ZenXplor
          </h1>
          <p className="text-[10px] uppercase tracking-[1.5px] text-slate-400 mt-1">Universal Search</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link to="/file-search" className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors duration-200 ${isActive('/file-search') ? 'text-slate-100 bg-[#34343B] font-medium border-r-2 border-[#6C63FF]' : 'text-slate-400 hover:text-slate-200 hover:bg-[#292A30]'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isActive('/file-search') ? 'text-[#6C63FF]' : ''}`}>search</span>
            <span className="text-sm">Search</span>
          </Link>
          <Link to="/storage-overview" className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors duration-200 ${isActive('/storage-overview') ? 'text-slate-100 bg-[#34343B] font-medium border-r-2 border-[#6C63FF]' : 'text-slate-400 hover:text-slate-200 hover:bg-[#292A30]'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isActive('/storage-overview') ? 'text-[#6C63FF]' : ''}`}>sync_alt</span>
            <span className="text-sm">Integrations</span>
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors duration-200 ${isActive('/settings') ? 'text-slate-100 bg-[#34343B] font-medium border-r-2 border-[#6C63FF]' : 'text-slate-400 hover:text-slate-200 hover:bg-[#292A30]'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isActive('/settings') ? 'text-[#6C63FF]' : ''}`}>settings</span>
            <span className="text-sm">Settings</span>
          </Link>
        </nav>
        <div className="mt-auto pt-6 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#292A30] transition-colors duration-200 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm">Exit Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* TopNavBar Component */}
      <header className="fixed top-0 right-0 w-[calc(100%-220px)] h-16 z-40 bg-[#121319]/70 backdrop-blur-xl flex items-center justify-between px-8 border-b border-white/5">
        <div className="flex items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined text-lg">search</span>
          <span className="text-xs font-mono opacity-50 tracking-widest">CMD + K TO EXPLORE</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-high/50 text-white text-sm border border-white/5 shadow-inner">
             <FaDesktop size={14} />
             <span className={`w-2 h-2 rounded-full ${agentRunning ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-red-400 shadow-[0_0_8px_#f87171]"}`} />
             <span className="text-xs font-bold text-slate-300 tracking-wider hidden sm:inline">{agentRunning ? "Agent Active" : "No Agent"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-[220px] pt-16 min-h-screen">
        {children}
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] left-[-15%] w-[40%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-surface-container-highest/10 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

export default DashboardLayout;
