import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import AgentDownloadModal from "../components/AgentDownloadModal";
import axios from "axios";
import { BACKEND_URL, AGENT_URL } from "../api";
import {
  FaCloud,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaFolder,
  FaFileAlt,
  
} from "react-icons/fa";

interface StorageStats {
  connected: boolean;
  count: number;
  status: string;
}

interface AllStats {
  local: StorageStats;
  google_drive: StorageStats;
  dropbox: StorageStats;
  gmail: StorageStats;
}

interface RecentFile {
  cloud_file_id: any;
  id: number;
  filename: string;
  filepath?: string;
  storage_type: string;
}

const Home: React.FC = () => {
  const [agentRunning, setAgentRunning] = useState(false);
  const [stats, setStats] = useState<AllStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Poll agent health
  useEffect(() => {
    const checkAgent = async () => {
      try {
        await axios.get(`${AGENT_URL}/health`, { timeout: 2000 });
        setAgentRunning(true);
      } catch {
        setAgentRunning(false);
      }
    };
    checkAgent();
    const id = setInterval(checkAgent, 10_000);
    return () => clearInterval(id);
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Storage Stats
        const statsRes = await axios.get(`${BACKEND_URL}/search/storage/stats`, {
          withCredentials: true,
        });
        setStats(statsRes.data);

        // Fetch Recent Activity
        const recentRes = await axios.get(`${BACKEND_URL}/search/search-files?q=&limit=6`, {
          withCredentials: true,
        });
        setRecentFiles(recentRes.data.results || []);

        // Fetch Recent Searches
        const searchRes = await axios.get(`${BACKEND_URL}/search/recent-searches`, { withCredentials: true });
        setRecentSearches(searchRes.data.recent_searches || []);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };
    fetchDashboardData();
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/file-search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/file-search`);
    }
  };

  const getFileIcon = (filePath: string = "", storageType: string) => {
    if (storageType === "google_drive") return <FaCloud className="text-blue-500" size={24} />;
    if (storageType === "dropbox") return <FaCloud className="text-indigo-500" size={24} />;

    const extension = filePath.split(".").pop()?.toLowerCase() || "";
    switch (extension) {
      case "pdf": return <FaFilePdf className="text-red-500" size={24} />;
      case "doc": case "docx": return <FaFileWord className="text-blue-600" size={24} />;
      case "jpg": case "jpeg": case "png": case "gif": return <FaFileImage className="text-purple-500" size={24} />;
      case "folder": return <FaFolder className="text-yellow-500" size={24} />;
      default: return <FaFileAlt className="text-slate-500" size={24} />;
    }
  };

  return (
    <DashboardLayout agentRunning={agentRunning}>
      <AgentDownloadModal agentRunning={agentRunning} />
      
      {/* Sticky Top Header w/ Search */}
      <header className="sticky top-14 pt-8 pb-4 px-10 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant/5">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
            </div>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[52px] pl-12 pr-16 bg-surface-container-low border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 outline-none"
              placeholder="Search files, documents, images across all sources..."
              type="text"
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <kbd className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-[11px] font-mono border border-outline-variant/20 shadow-sm">
                ↵ Enter
              </kbd>
            </div>
          </form>

          {recentSearches.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/file-search?q=${encodeURIComponent(s)}`)}
                  className="px-3 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-[10px] text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-highest transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[12px]">history</span>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Source Filters (Visual only on Home page) */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 custom-scrollbar">
            <button className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-medium uppercase tracking-[0.5px]">All sources</button>
            <button className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white transition-colors text-[11px] font-medium uppercase tracking-[0.5px]">Local</button>
            <button className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white transition-colors text-[11px] font-medium uppercase tracking-[0.5px]">Google Drive</button>
            <button className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white transition-colors text-[11px] font-medium uppercase tracking-[0.5px]">Dropbox</button>
          </div>
        </div>
      </header>

      <section className="px-10 py-12 max-w-5xl mx-auto space-y-12">
        {/* Source Tiles Grid */}
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.5px] font-medium text-on-surface-variant mb-4">Connected Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Google Drive */}
            {stats?.google_drive.connected && (
              <div className="bg-surface-container-lowest border border-outline-variant/15 p-5 rounded-xl hover:border-primary/40 transition-colors group cursor-pointer" onClick={() => navigate('/storage-overview')}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#34A853]">add_to_drive</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Google Drive</p>
                      <p className="text-xs text-on-surface-variant font-mono">
                        {stats.google_drive.count.toLocaleString()} files
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#34A853]/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
                    <span className="text-[10px] font-medium text-[#34A853] uppercase tracking-wider">Connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Local Disk - Always Connected */}
            <div className="bg-surface-container-lowest border border-outline-variant/15 p-5 rounded-xl hover:border-primary/40 transition-colors group cursor-pointer" onClick={() => navigate('/file-search')}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">hard_drive</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Local Disk</p>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {stats ? `${stats.local.count.toLocaleString()} files` : "Loading..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#34A853]/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
                  <span className="text-[10px] font-medium text-[#34A853] uppercase tracking-wider">Connected</span>
                </div>
              </div>
            </div>

            {/* Dropbox */}
            {stats?.dropbox.connected && (
              <div className="bg-surface-container-lowest border border-outline-variant/15 p-5 rounded-xl hover:border-primary/40 transition-colors group cursor-pointer" onClick={() => navigate('/storage-overview')}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#0061FF]">package_2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Dropbox</p>
                      <p className="text-xs text-on-surface-variant font-mono">
                        {stats.dropbox.count.toLocaleString()} files
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#34A853]/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
                    <span className="text-[10px] font-medium text-[#34A853] uppercase tracking-wider">Connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gmail */}
            {stats?.gmail.connected && (
              <div className="bg-surface-container-lowest border border-outline-variant/15 p-5 rounded-xl hover:border-primary/40 transition-colors group cursor-pointer" onClick={() => navigate('/storage-overview')}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#EA4335]">mail</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Gmail</p>
                      <p className="text-xs text-on-surface-variant font-mono">Emails & Attachments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#34A853]/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
                    <span className="text-[10px] font-medium text-[#34A853] uppercase tracking-wider">Connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Add Source */}
            <div onClick={() => navigate('/storage-overview')} className="border-2 border-dashed border-outline-variant/30 p-5 rounded-xl hover:border-primary hover:bg-surface-container/30 transition-all cursor-pointer flex items-center justify-center group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">add_circle</span>
                <span className="text-sm font-semibold text-on-surface-variant group-hover:text-white transition-colors">Add source</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Accessed */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[11px] uppercase tracking-[0.5px] font-medium text-on-surface-variant">Recently accessed</h3>
            <button onClick={() => navigate('/file-search')} className="text-[10px] font-semibold text-primary hover:underline">VIEW ALL HISTORY</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {recentFiles.length > 0 ? (
              recentFiles.map(file => (
                <div 
                  key={file.id} 
                  onClick={async () => {
                    try {
                      await axios.post(`${BACKEND_URL}/search/file/access`, {
                        id: file.id,
                        filepath: file.filepath,
                        cloud_file_id: file.cloud_file_id
                      }, { withCredentials: true });
                    } catch (e) {}
                    navigate(`/file-search?q=${encodeURIComponent(file.filename)}`);
                  }}
                  className="flex-shrink-0 w-48 bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 hover:bg-surface-container-high transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 mb-4 bg-surface-container-high rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getFileIcon(file.filepath, file.storage_type)}
                  </div>
                  <p className="text-sm font-medium text-white truncate mb-1" title={file.filename}>{file.filename}</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-on-surface-variant">
                      {file.storage_type === 'local' ? 'hard_drive' : file.storage_type.includes('google') ? 'add_to_drive' : 'package_2'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono truncate">
                      {file.storage_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-on-surface-variant italic">No recent files found.</div>
            )}
          </div>
        </div>
      </section>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => navigate('/file-search')}
          className="w-14 h-14 rounded-full bg-primary text-background shadow-[0_0_20px_rgba(196,192,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
        </button>
      </div>
    </DashboardLayout>
  );
};

export default Home;
