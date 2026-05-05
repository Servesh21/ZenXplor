import { BACKEND_URL, AGENT_URL } from "../api";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaSync, FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import AgentDownloadModal from "../components/AgentDownloadModal";

interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: string;
  cloud_file_id?: string;
  is_favorite: boolean;
  filetype?: string;
  last_modified?: string;
}

/** Stable numeric ID derived from a file path (for agent results). */
const pathToId = (fp: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < fp.length; i++) {
    h ^= fp.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return -(h % 2_000_000_000 || 1);
};

const FileSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState("not_started");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileDetails, setSelectedFileDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Windows Desktop Agent state
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentScanning, setAgentScanning] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  const LIMIT = 12;

  // Poll agent health every 10s
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

  const fetchRecentSearches = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/search/recent-searches`, { withCredentials: true });
      setRecentSearches(res.data.recent_searches || []);
    } catch (err) {
      console.error("Failed to fetch recent searches", err);
    }
  };

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  // Fetch search results with filters
  const fetchFiles = async (newQuery = query, page = 1) => {
    setLoading(true);
    const offset = (page - 1) * LIMIT;
    try {
      const response = await axios.get(`${BACKEND_URL}/search/search-files`, {
        params: { q: newQuery, offset, limit: LIMIT, service: serviceFilter, filetype: fileTypeFilter },
        withCredentials: true,
      });
      
      let newData: FileItem[] = response.data.results;
      const totalResults = response.data.total_results || 0;
      setTotalPages(Math.ceil(totalResults / LIMIT) || 1);

      // Augment with agent-indexed local results ONLY on page 1 for now
      if (page === 1 && agentRunning && newQuery.trim() &&
        (!serviceFilter || serviceFilter === "local")) {
        try {
          const agentRes = await axios.get(`${AGENT_URL}/search`, {
            params: { q: newQuery, limit: 10, filetype: fileTypeFilter || undefined },
            timeout: 2000,
          });
          const seenPaths = new Set(newData.map((f) => f.filepath));
          const agentItems: FileItem[] = (agentRes.data.results || [])
            .filter((r: { filepath: string }) => !seenPaths.has(r.filepath))
            .map((r: { filepath: string; filename: string; filetype?: string; last_modified?: string }) => ({
              id: pathToId(r.filepath),
              filename: r.filename,
              filepath: r.filepath,
              storage_type: "local",
              cloud_file_id: undefined,
              is_favorite: false,
              filetype: r.filetype,
              last_modified: r.last_modified
            }));
          newData = [...agentItems, ...newData];
        } catch {
          // Agent search failed — continue with backend results only
        }
      }

      setFiles(newData);
      setCurrentPage(page);
    } catch (error) {
      console.error("Search failed:", error);
      setFiles([]);
      showToastNotification("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Ctrl+K / ⌘K is now handled globally by the CommandPalette in DashboardLayout

  // Fetch details when selection changes
  useEffect(() => {
    if (!selectedFilePath) {
      setSelectedFileDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const file = files.find(f => (f.filepath || f.cloud_file_id || String(f.id)) === selectedFilePath);
        if (!file) return;

        const response = await axios.get(`${BACKEND_URL}/search/file-details`, {
          params: { id: file.id, filepath: file.filepath },
          withCredentials: true,
        });

        const details = response.data;
        if (details.preview_url === 'local_agent_preview' && agentRunning) {
          details.preview_url = `${AGENT_URL}/preview?filepath=${encodeURIComponent(file.filepath || '')}`;
        }
        
        setSelectedFileDetails(details);
      } catch (error) {
        console.error("Failed to fetch details:", error);
        setSelectedFileDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedFilePath, files, agentRunning]);

  // Single debounced search effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchFiles(query, 1);
      if (query.trim()) {
        setTimeout(fetchRecentSearches, 1000); // Fetch recent searches after a small delay to allow backend to record
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [query, serviceFilter, fileTypeFilter]);

  const handleFileAccess = async (file: any) => {
    if (!file) return;
    try {
      await axios.post(`${BACKEND_URL}/search/file/access`, {
        id: file.id,
        filepath: file.filepath,
        cloud_file_id: file.cloud_file_id
      }, { withCredentials: true });
    } catch (error) {
      console.error("Failed to log file access", error);
    }
  };

  const handleDownload = async (file: any) => {
    handleFileAccess(file);
    const { filepath, filename, storage_type } = file;
    if (storage_type === "local") {
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

    try {
      const response = await axios.get(`${BACKEND_URL}/search/download-file`, {
        params: { filepath, id: file.id },
        withCredentials: true,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToastNotification("Download started...");
    } catch (error: any) {
      console.error("Download failed:", error);
      
      // Try to parse the error blob if possible
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          if (json.code === "permission_denied") {
            showToastNotification("Permission denied. Re-connect Google account in Settings.");
            return;
          }
          showToastNotification(json.error || "Download failed.");
          return;
        } catch (e) {
          // fallback to generic error
        }
      }
      
      showToastNotification("Download failed. Please check your permissions.");
    }
  };

  const handleOpenFileLocation = async (file: any) => {
    handleFileAccess(file);
    const { filepath, storage_type } = file;
    if (storage_type === "local") {
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
      const response = await axios.post(`${BACKEND_URL}/search/open-file`, { filepath, id: file.id }, { withCredentials: true });
      if (response.data.url) {
         window.open(response.data.url, "_blank");
      }
      showToastNotification("Opening file location");
    } catch {
      showToastNotification("Failed to open file location");
    }
  };

  const handleAgentScan = async () => {
    if (!agentRunning) {
      showToastNotification("ZenXplor Desktop Agent is not running. Please install and start it first.");
      return;
    }
    setIndexingStatus("indexing");
    setAgentScanning(true);
    try {
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
    if (storageType === "google_drive") return "cloud";
    if (storageType === "dropbox") return "cloud";
    
    const extension = filePath.split(".").pop()?.toLowerCase() || "";
    switch (extension) {
      case "pdf": return "picture_as_pdf";
      case "doc":
      case "docx": return "description";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif": return "image";
      case "folder": return "folder";
      case "xlsx":
      case "xls": return "table_view";
      default: return "article";
    }
  };

  const toggleFavorite = async (filepath: string) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/search/${encodeURIComponent(filepath)}/favorite`,
        {},
        { withCredentials: true }
      );
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

  const handleKeyDown = (_e: React.KeyboardEvent) => {
    // Local keydown handler can still exist but global one takes precedence
    
  };

  return (
    <DashboardLayout agentRunning={agentRunning}>
      <AgentDownloadModal agentRunning={agentRunning} />
      <div onKeyDown={handleKeyDown} className="flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex-none flex items-center justify-between px-6 bg-[#1A1B22] border-b border-[#2A2C3E] z-40">
          <div className="flex items-center gap-4 flex-1 max-w-2xl relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
              search
            </span>
            <input
              ref={searchInputRef}
              className="w-full bg-[#1A1B26] border border-[#2A2C3E] rounded-xl pl-10 pr-10 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
              placeholder="Search files across all platforms... (Ctrl+K)"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  fetchFiles("", 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-6 flex-wrap">
            <div className="flex items-center gap-1 bg-[#13141C] p-1 rounded-lg border border-[#2A2C3E]">
              {[
                { key: "pdf", label: "PDF" },
                { key: "png", label: "IMG" },
                { key: "docx", label: "DOC" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFileTypeFilter(fileTypeFilter === key ? "" : key)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    fileTypeFilter === key
                      ? "bg-primary-container text-on-primary-fixed"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 bg-[#13141C] p-1 rounded-lg border border-[#2A2C3E]">
              {[
                { key: "local", label: "Local" },
                { key: "google_drive", label: "Drive" },
                { key: "dropbox", label: "Dropbox" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setServiceFilter(serviceFilter === key ? "" : key)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    serviceFilter === key
                      ? "bg-primary-container text-on-primary-fixed"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(fileTypeFilter || serviceFilter) && (
              <button onClick={resetFilters} className="text-red-400 text-[10px] uppercase font-bold px-2 hover:underline">
                Clear
              </button>
            )}

            <button
              onClick={handleAgentScan}
              disabled={indexingStatus === "indexing" || agentScanning}
              className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <FaSync className={indexingStatus === "indexing" ? "animate-spin" : ""} size={12} />
              Scan
            </button>
          </div>
        </header>

        {/* Content Area - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Results List (65% or 100%) */}
          <section className={`flex flex-col h-full bg-surface-container-lowest transition-all duration-300 ${selectedFilePath ? 'w-[65%]' : 'w-full'}`}>
            <div className="px-8 py-4 flex justify-between items-end border-b border-outline-variant/10">
              <div className="flex flex-col gap-2 w-full">
                {!query && recentSearches.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/50 mb-3">Recent Searches</h4>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(s)}
                          className="px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/10 text-xs text-on-surface hover:border-primary/50 hover:bg-surface-container-highest transition-all flex items-center gap-2 group"
                        >
                          <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-primary">history</span>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-primary">{files.length}</span>
                    <span className="text-sm text-on-surface-variant">{query ? 'results' : 'recent files'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {loading && <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin"></div>}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1 bg-[#13141C] p-0.5 rounded-lg border border-[#2A2C3E]">
                        <button
                          disabled={currentPage === 1 || loading}
                          onClick={() => fetchFiles(query, currentPage - 1)}
                          className="p-1 rounded text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-30"
                          title="Previous Page"
                        >
                          <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <span className="text-[10px] font-bold text-on-surface-variant px-1">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          disabled={currentPage === totalPages || loading}
                          onClick={() => fetchFiles(query, currentPage + 1)}
                          className="p-1 rounded text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-30"
                          title="Next Page"
                        >
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={fileListRef}
              className="flex-1 overflow-y-auto px-8 pb-10 pt-4 space-y-2"
            >
              {files.map((file) => {
                const fileKey = file.filepath || file.cloud_file_id || String(file.id);
                const isSelected = selectedFilePath === fileKey;
                const iconName = getFileIcon(file.filepath, file.storage_type);
                const extText = (file.filetype || file.filepath?.split('.').pop() || "FILE").toUpperCase();

                return (
                  <div
                    key={fileKey}
                    onClick={() => setSelectedFilePath(isSelected ? null : fileKey)}
                    className={`group flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "bg-[#1A1B26] border-[#2A2C3E] shadow-sm" 
                        : "bg-[#13141C] border-[#1E2030] hover:bg-[#1A1B26] hover:border-[#2A2C3E]"
                    }`}
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-lg flex flex-col items-center justify-center border ${
                      isSelected ? "bg-primary/10 border-primary/20" : "bg-[#20212E] border-outline-variant/10"
                    }`}>
                      <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-primary' : 'text-on-surface-variant/70'}`}>
                        {iconName}
                      </span>
                      <span className={`text-[8px] font-black uppercase ${isSelected ? 'text-primary' : 'text-on-surface-variant/70'}`}>
                        {extText.substring(0, 4)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-on-surface truncate">{file.filename}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-mono text-[11px] text-on-surface-variant/50 truncate max-w-[50%]">
                          {file.filepath}
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border ${
                            file.storage_type === 'google_drive' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            file.storage_type === 'dropbox' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {file.storage_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <span className="text-[11px] text-on-surface-variant/60 font-medium">
                        {file.last_modified || "Recent"}
                      </span>
                      <div className={`flex items-center gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(file.filepath || "");
                          }}
                          className={`p-1 transition-colors ${file.is_favorite ? 'text-yellow-400' : 'text-on-surface-variant hover:text-primary'}`}
                        >
                          <span className="material-symbols-outlined text-lg" style={file.is_favorite ? {fontVariationSettings: "'FILL' 1"} : {}}>star</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2 pb-4">
                  <button
                    disabled={currentPage === 1 || loading}
                    onClick={() => fetchFiles(query, currentPage - 1)}
                    className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="text-sm font-medium text-on-surface-variant px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages || loading}
                    onClick={() => fetchFiles(query, currentPage + 1)}
                    className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Detail Panel (35%) */}
          {selectedFilePath && (
            <aside className="w-[35%] bg-[#0D0E14] border-l border-[#1E2030] flex flex-col h-full overflow-y-auto">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-8 w-8 border-t-2 border-primary rounded-full animate-spin"></div>
                </div>
              ) : selectedFileDetails ? (
                <div className="p-8 space-y-8">
                  {/* Detail Header */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-2xl">{getFileIcon(selectedFileDetails.filepath, selectedFileDetails.storage_type)}</span>
                        <span className="text-[10px] font-black text-primary uppercase">{(selectedFileDetails.filetype || "FILE").substring(0, 4)}</span>
                      </div>
                      <button onClick={() => setSelectedFilePath(null)} className="text-on-surface-variant hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-on-surface leading-tight break-all">{selectedFileDetails.filename}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase border border-blue-500/20">
                          {selectedFileDetails.storage_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-on-surface-variant">• Updated {selectedFileDetails.last_modified}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Image */}
                  <div className="aspect-[4/3] bg-[#1A1B26] rounded-xl border border-[#2A2C3E] relative overflow-hidden group flex items-center justify-center">
                    {selectedFileDetails.preview_url ? (
                      <img 
                        src={selectedFileDetails.preview_url} 
                        alt="Document preview" 
                        className="w-full h-full object-cover opacity-80"
                        onError={(e) => {
                          // Fallback if preview fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                       <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">{getFileIcon(selectedFileDetails.filepath, selectedFileDetails.storage_type)}</span>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleOpenFileLocation(selectedFileDetails)} className="p-3 bg-primary/80 rounded-full text-white shadow-lg hover:bg-primary transition-colors">
                          <span className="material-symbols-outlined">visibility</span>
                       </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase tracking-[1px] font-bold text-outline">Properties</h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      <div>
                        <p className="text-[10px] text-on-surface-variant/60 uppercase font-semibold">Size</p>
                        <p className="text-sm font-mono text-on-surface mt-0.5">{selectedFileDetails.size || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant/60 uppercase font-semibold">Type</p>
                        <p className="text-sm font-mono text-on-surface mt-0.5 capitalize">{selectedFileDetails.filetype || "Document"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-on-surface-variant/60 uppercase font-semibold">File Path</p>
                        <p className="text-sm font-mono text-on-surface mt-0.5 break-all">{selectedFileDetails.filepath}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant/60 uppercase font-semibold">Created</p>
                        <p className="text-sm font-mono text-on-surface mt-0.5">{selectedFileDetails.created_at || selectedFileDetails.last_modified}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant/60 uppercase font-semibold">Owner</p>
                        <p className="text-sm font-mono text-on-surface mt-0.5">{selectedFileDetails.owner || "Me"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-[#1E2030]">
                    <button onClick={() => handleOpenFileLocation(selectedFileDetails)} className="w-full bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] py-3 rounded-lg text-[#1b0091] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                      Open File
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleDownload(selectedFileDetails)} className="py-2.5 bg-surface-container-high border border-outline-variant/30 rounded-lg text-on-surface font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Download
                      </button>
                      <button onClick={() => {
                        navigator.clipboard.writeText(selectedFileDetails.filepath || "");
                        showToastNotification("Copied path to clipboard");
                      }} className="py-2.5 bg-transparent border border-outline-variant/20 rounded-lg text-on-surface-variant font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface-container hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                        Copy Path
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </aside>
          )}
        </div>

        {/* Toast */}
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
    </DashboardLayout>
  );
};

export default FileSearch;
