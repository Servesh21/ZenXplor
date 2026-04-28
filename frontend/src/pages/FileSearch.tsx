import { BACKEND_URL } from "../api";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { 
  FaSync, 
  FaFileAlt, FaFilePdf, FaFileWord, 
  FaFileImage, FaFolder, FaCloud, 
  FaDesktop, FaRegStar, FaStar, FaTimes
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const AGENT_URL = "https://127.0.0.1:7832";

interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: string;
  cloud_file_id?: string;
  is_favorite: boolean;
}

// const getFileExtension = (name: string): string => {
//   const lastDotIndex = name.lastIndexOf(".");
//   if (lastDotIndex <= 0 || lastDotIndex === name.length - 1) {
//     return "unknown";
//   }
//   return name.slice(lastDotIndex + 1).toLowerCase();
// };

/** Stable numeric ID derived from a file path (for agent results). */
const pathToId = (fp: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < fp.length; i++) {
    h ^= fp.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Negative range so it never clashes with positive DB ids
  return -(h % 2_000_000_000 || 1);
};

const FileSearch: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState("not_started");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");

  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Windows Desktop Agent state
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentScanning, setAgentScanning] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const LIMIT = 10;
  useEffect(() => {
    // Reset results when search criteria changes
    setFiles([]);
    setOffset(0);
    setHasMore(true);
  
    const delaySearch = setTimeout(() => {
      if (query.trim() || serviceFilter || fileTypeFilter) {
        fetchFiles(query, 0);
      }
    }, 500);
  
    return () => clearTimeout(delaySearch);
  }, [query, serviceFilter, fileTypeFilter]);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/auth/check-auth`, { 
          withCredentials: true 
        });
        
        // If no user is logged in or auth check fails, redirect to login
        if (!response.data.authenticated) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Poll agent health every 10 s so the indicator stays current
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

  // Fetch search results with filters
  const fetchFiles = async (newQuery = query, newOffset = offset) => {
    if (loading || (!newQuery.trim() && !serviceFilter && !fileTypeFilter) || !hasMore) return;
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/search/search-files`, {
        params: { q: newQuery, offset: newOffset, limit: LIMIT, service: serviceFilter, filetype: fileTypeFilter },
        withCredentials: true,
      });
      console.log("Search response:", response.data);
      let newData: FileItem[] = response.data.results;

      // On fresh search, augment with agent-indexed local results
      if (newOffset === 0 && agentRunning && newQuery.trim() &&
          (!serviceFilter || serviceFilter === "local")) {
        try {
          const agentRes = await axios.get(`${AGENT_URL}/search`, {
            params: { q: newQuery, limit: 50, filetype: fileTypeFilter || undefined },
            timeout: 3000,
          });
          const seenPaths = new Set(newData.map((f) => f.filepath));
          const agentItems: FileItem[] = (agentRes.data.results || [])
            .filter((r: { filepath: string }) => !seenPaths.has(r.filepath))
            .map((r: { filepath: string; filename: string }) => ({
              id: pathToId(r.filepath),
              filename: r.filename,
              filepath: r.filepath,
              storage_type: "local",
              cloud_file_id: undefined,
              is_favorite: false,
            }));
          newData = [...agentItems, ...newData];
        } catch {
          // Agent search failed — continue with backend results only
        }
      }

      setFiles((prev) => (newOffset === 0 ? newData : [...prev, ...newData]));
      setHasMore(response.data.has_more);
      setOffset(newOffset + LIMIT);
    } catch (error) {
      console.error("Search failed:", error);
      if (newOffset === 0) setFiles([]);
      showToastNotification("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.trim() || serviceFilter || fileTypeFilter) {
        setOffset(0);
        setHasMore(true);
        fetchFiles(query, 0);
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [query, serviceFilter, fileTypeFilter]);

  // Infinite scrolling observer
  const fileListRef = useRef<HTMLDivElement>(null);
  const lastFileRef = useCallback(
    (node: HTMLLIElement | HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            console.log("Last element is visible, loading more files...");
            fetchFiles(query, offset);
          }
        },
        { threshold: 0.5 }
      );
      
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, query, offset]
  );

  const handleDownload = async (filepath: string, filename: string) => {
    // Real local paths (e.g. C:\Users\...) — route through the Desktop Agent
    if (!filepath.startsWith("upload://") && !filepath.startsWith("http")) {
      if (!agentRunning) {
        showToastNotification("ZenXplor Desktop Agent is not running. Cannot download local files.");
        return;
      }
      try {
        const url = `${AGENT_URL}/download?filepath=${encodeURIComponent(filepath)}`;
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToastNotification(`Downloaded ${filename}`);
      } catch (error) {
        console.error("Agent download failed:", error);
        showToastNotification("Failed to download file");
      }
      return;
    }

    // Uploaded / cloud files — backend download
    try {
      const response = await axios.get(`${BACKEND_URL}/search/download-file?filepath=${encodeURIComponent(filepath)}`, {
        withCredentials: true,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || filepath.split("/").pop() || "file");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToastNotification(`Downloaded ${filename}`);
    } catch (error) {
      console.error("Failed to download file:", error);
      showToastNotification("Failed to download file");
    }
  };

  const handleOpenFileLocation = async (filepath: string) => {
    // Real local paths — route through the Desktop Agent
    if (!filepath.startsWith("upload://") && !filepath.startsWith("http")) {
      if (!agentRunning) {
        showToastNotification("ZenXplor Desktop Agent is not running. Cannot open local files.");
        return;
      }
      try {
        await axios.post(`${AGENT_URL}/open`, { filepath }, { timeout: 5000 });
        showToastNotification("Opening file location in Explorer");
      } catch (error) {
        console.error("Agent open failed:", error);
        showToastNotification("Could not open file location");
      }
      return;
    }

    try {
      await axios.post("${BACKEND_URL}/search/open-file", { filepath }, { withCredentials: true });
      showToastNotification("Opening file location");
    } catch {
      showToastNotification("Opening file location");
    }
  };

  /** Trigger a full filesystem scan via the Desktop Agent. */
  const handleAgentScan = async () => {
    if (!agentRunning) {
      showToastNotification("ZenXplor Desktop Agent is not running. Please install and start it first.");
      return;
    }
    setIndexingStatus("indexing");
    setAgentScanning(true);
    try {
      // Step 1: Re-fetch a fresh token from the backend and push it to the agent.
      // This is essential — without a valid token the agent silently skips all sync.
      try {
        const authRes = await fetch(`${BACKEND_URL}/auth/check-auth`, { credentials: "include" });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.token) {
            await fetch(`${AGENT_URL}/auth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jwt_token: authData.token, backend_url: `${BACKEND_URL}` }),
            });
          }
        }
      } catch {
        // Non-fatal: agent may already have a valid token; continue with scan.
        console.warn("Could not refresh agent token before scan — proceeding with existing token.");
      }

      // Step 2: Trigger the scan.
      const res = await axios.post(`${AGENT_URL}/scan`, {}, { timeout: 5000 });
      if (res.data.scanning) {
        showToastNotification("Scan started — the agent is indexing your files in the background.");
        setIndexingStatus("completed");
      } else {
        showToastNotification(res.data.message || "Scan already running.");
        setIndexingStatus("not_started");
      }
    } catch {
      setIndexingStatus("failed");
      showToastNotification("Failed to start scan. Is the Desktop Agent running?");
    } finally {
      setAgentScanning(false);
      setTimeout(() => setIndexingStatus("not_started"), 3000);
    }
  };


  const resetFilters = () => {
    setServiceFilter("");
    setFileTypeFilter("");
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getFileIcon = (filePath: string = "", storageType: string) => {
    if (storageType === "google_drive") return <FaCloud className="text-blue-500" size={24} />;
    if (storageType === "dropbox") return <FaCloud className="text-indigo-500" size={24} />;
    
    const extension = filePath.split('.').pop()?.toLowerCase() || "";
    
    switch (extension) {
      case "pdf":
        return <FaFilePdf className="text-red-500" size={24} />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-600" size={24} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FaFileImage className="text-purple-500" size={24} />;
      case "folder":
        return <FaFolder className="text-yellow-500" size={24} />;
      default:
        return <FaFileAlt className="text-gray-500" size={24} />;
    }
  };



  const toggleFavorite = async (filepath: string) => {
    try {
      
      const res = await axios.post(
        `${BACKEND_URL}/search/${encodeURIComponent(filepath)}/favorite`,{}, { withCredentials: true }
      );
      console.log("Favorite status updated", res.data);
      const updatedFile = res.data.file;
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.filepath === updatedFile.filepath
            ? { ...file, is_favorite: updatedFile.is_favorite }
            : file
        )
      );

    } catch (error) {
      console.error("Error updating favorite status", error);
    }
  };
  



  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+F to focus search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  const getSortedFiles = () => {
    if (!files.length) return [];
    
    return [...files].sort((a, b) => {
      // Default fallback to name sorting
      return a.filename.localeCompare(b.filename);
    });
  };

  const sortedFiles = getSortedFiles();

  return (
    <div className="bg-[#0d0e14] text-[#e3e1ea] font-body selection:bg-primary/30 min-h-screen" onKeyDown={handleKeyDown}>
      {/* SideNavBar Component */}
      <aside className="w-[220px] h-screen fixed left-0 top-0 bg-slate-900 dark:bg-[#1E1F26] flex flex-col py-6 px-4 z-50">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-semibold tracking-tighter text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">deployed_code</span> ZenXplor
          </h1>
          <p className="text-[10px] uppercase tracking-[1.5px] text-slate-400 mt-1">Universal Search</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-slate-100 bg-[#34343B] font-medium border-r-2 border-[#6C63FF] transition-colors duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span className="text-sm">Search</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#292A30] transition-colors duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="text-sm">Recent</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#292A30] transition-colors duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]">grade</span>
            <span className="text-sm">Starred</span>
          </a>
          <a onClick={() => setServiceFilter("google_drive")} className="cursor-pointer flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#292A30] transition-colors duration-200">
            <span className="material-symbols-outlined text-[20px]">cloud</span>
            <span className="text-sm">Drive Filter</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#292A30] transition-colors duration-200" href="/settings">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm">Settings</span>
          </a>
        </nav>
        <div className="mt-auto pt-6 space-y-1">
          <button onClick={handleAgentScan} disabled={indexingStatus === "indexing" || agentScanning} className="w-full justify-center flex items-center gap-2 mb-6 py-2.5 px-4 rounded-lg bg-[#6C63FF] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all active:scale-95">
             <FaSync className={indexingStatus === "indexing" ? "animate-spin" : ""} size={14} />
             {indexingStatus === "indexing" ? "Scanning..." : "Connect Local"}
          </button>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#292A30] transition-colors duration-200" href="/">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm">Exit Search</span>
          </a>
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

      {/* Main Canvas */}
      <main className="ml-[220px] pt-16 min-h-screen">
        <section className="max-w-4xl mx-auto pt-20 pb-12 px-8 flex flex-col items-center relative">
          <h2 className="headline-md text-3xl font-bold tracking-tight mb-8 text-center text-on-surface">
            Architect your workspace.
          </h2>
          <div className="w-full relative group">
            <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full -z-10 group-focus-within:bg-primary/20 transition-all duration-500"></div>
            <div className={`glass-panel w-full rounded-2xl border ${searchFocused ? "border-primary/50 shadow-[0_0_30px_rgba(196,192,255,0.15)]" : "border-outline-variant/15"} flex items-center px-6 py-5 shadow-2xl transition-all duration-300`}>
              <span className="material-symbols-outlined text-primary text-2xl mr-4 drop-shadow-[0_0_8px_rgba(196,192,255,0.5)]">search</span>
              <input 
                ref={searchInputRef}
                className="bg-transparent border-none focus:ring-0 text-xl w-full text-on-surface placeholder:text-on-surface-variant/40 outline-none" 
                placeholder="Search files, tasks, or integrations..." 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("")
                    setOffset(0);
                    setFiles([]);
                  }}
                  className="px-3 text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={18} />
                </button>
              )}
              <div className="flex gap-2 ml-4 opacity-50 hidden sm:flex">
                <kbd className="px-2 py-1 rounded bg-surface-container-highest text-[10px] font-mono text-on-surface-variant border border-outline-variant/20">CMD</kbd>
                <kbd className="px-2 py-1 rounded bg-surface-container-highest text-[10px] font-mono text-on-surface-variant border border-outline-variant/20">K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-8 flex-wrap justify-center">
             <span className="text-[11px] uppercase tracking-[1px] text-on-surface-variant/60 self-center mr-2">Filter by</span>
             <button onClick={() => setFileTypeFilter(fileTypeFilter === "pdf" ? "" : "pdf")} className={`px-4 py-1.5 rounded-full ${fileTypeFilter === 'pdf' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-high border-outline-variant/10'} text-on-surface text-xs border hover:border-primary/50 transition-colors shadow-sm`}>Documents</button>
             <button onClick={() => setFileTypeFilter(fileTypeFilter === "png" ? "" : "png")} className={`px-4 py-1.5 rounded-full ${fileTypeFilter === 'png' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-high border-outline-variant/10'} text-on-surface text-xs border hover:border-primary/50 transition-colors shadow-sm`}>Images</button>
             <button onClick={() => setFileTypeFilter(fileTypeFilter === "folder" ? "" : "folder")} className={`px-4 py-1.5 rounded-full ${fileTypeFilter === 'folder' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-high border-outline-variant/10'} text-on-surface text-xs border hover:border-primary/50 transition-colors shadow-sm`}>Folders</button>
             {(fileTypeFilter || serviceFilter) && (
                <button onClick={resetFilters} className="text-red-400 text-xs px-2 hover:underline ml-2">Clear filters</button>
             )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-8 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-on-surface">
                {query ? (files.length > 0 ? `Found ${files.length} results` : 'Search Results') : 'Recent Activity'}
              </h3>
              <p className="text-xs text-on-surface-variant/60 font-mono mt-1 w-full truncate">/workspace/results</p>
            </div>
            {loading && <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin shadow-[0_0_8px_rgba(196,192,255,0.8)]"></div>}
          </div>
          
          {files.length === 0 && !loading && (query || fileTypeFilter || serviceFilter) && (
              <div className="text-center py-20 opacity-50 bg-surface-container-low rounded-2xl border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-4xl mb-4 text-primary">search_off</span>
                  <p className="text-lg">No results found for your query.</p>
              </div>
          )}

          <div ref={fileListRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            {sortedFiles.map((file, index) => (
              <div 
                key={file.id}
                ref={index === sortedFiles.length - 1 && hasMore ? lastFileRef : null}
                onClick={() => setSelectedFile(selectedFile === file.id ? null : file.id)}
                className={`bg-surface-container-low hover:bg-surface-container-high border ${selectedFile === file.id ? 'border-primary shadow-[0_0_15px_rgba(196,192,255,0.15)] bg-surface-container-highest' : 'border-outline-variant/15'} p-5 rounded-xl transition-all duration-300 group cursor-pointer flex flex-col h-[180px] relative overflow-hidden`}
              >
                {selectedFile === file.id && <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_10px_rgba(196,192,255,0.8)]"></div>}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary text-xl border border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(file.filepath, file.storage_type)}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0D0E14] px-2 py-1 rounded border border-outline-variant/10 shadow-inner">
                    <span className="material-symbols-outlined text-[14px] text-blue-400">
                      {file.storage_type === 'local' ? 'desktop_windows' : 'cloud'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-300 capitalize">{file.storage_type.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-on-surface mb-1 group-hover:text-primary transition-colors truncate drop-shadow-sm">{file.filename}</h4>
                <p className="text-[10px] font-mono text-on-surface-variant/60 mb-4 truncate w-full" title={file.filepath}>{file.filepath || 'Cloud storage'}</p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/5">
                   <div className="flex space-x-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleFavorite(file.filepath || "");
                         }}
                         className={`hover:scale-125 transition-transform duration-300 ${file.is_favorite ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-on-surface-variant/40'}`}
                       >
                         {file.is_favorite ? <FaStar size={14} /> : <FaRegStar size={14} />}
                       </button>
                   </div>
                   
                   <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      {file.storage_type === "local" && (
                         <>
                           <button onClick={(e) => { e.stopPropagation(); handleDownload(file.filepath!, file.filename); }} className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/20" title="Download">
                             <span className="material-symbols-outlined text-[16px]">download</span>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleOpenFileLocation(file.filepath!); }} className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/20" title="Open Location">
                             <span className="material-symbols-outlined text-[16px]">folder_open</span>
                           </button>
                         </>
                      )}
                      {(file.storage_type === "google_drive" || file.storage_type === "dropbox") && (
                         <a href={file.storage_type === "google_drive" ? `https://drive.google.com/open?id=${file.cloud_file_id}` : `https://www.dropbox.com/home/${file.cloud_file_id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors border border-indigo-500/20" title="Open Cloud Link" onClick={(e) => e.stopPropagation()}>
                           <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                         </a>
                      )}
                   </div>
                </div>
              </div>
            ))}
            
            {loading && files.length > 0 && (
              <div className="flex justify-center items-center h-[180px] w-full bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant/20 gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                <span className="text-on-surface-variant text-sm font-mono">Loading matrix...</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] left-[-15%] w-[40%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-surface-container-highest/10 blur-[100px] rounded-full"></div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-surface-container-high text-white border border-outline-variant/20 px-4 py-3 rounded-xl shadow-2xl z-[100] backdrop-blur-md"
          >
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary">check_circle</span>
              <p className="text-sm font-medium tracking-wide">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileSearch;
