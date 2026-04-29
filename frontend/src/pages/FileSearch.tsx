import { BACKEND_URL, AGENT_URL } from "../api";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  FaSync,
  FaFileAlt, FaFilePdf, FaFileWord,
  FaFileImage, FaFolder, FaCloud,
  FaRegStar, FaStar, FaTimes,
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Windows Desktop Agent state
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentScanning, setAgentScanning] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  const LIMIT = 12; // 3x4 grid fits better

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

      // Augment with agent-indexed local results ONLY on page 1 for now (to avoid complexity of merging distributed paginated sets)
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

  // Single debounced search effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchFiles(query, 1);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [query, serviceFilter, fileTypeFilter]);

  const handleDownload = async (filepath: string, filename: string) => {
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
      await axios.post(`${BACKEND_URL}/search/open-file`, { filepath }, { withCredentials: true });
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
        console.warn("Could not refresh agent token before scan — proceeding with existing token.");
      }

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

    const extension = filePath.split(".").pop()?.toLowerCase() || "";

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
        return <FaFileAlt className="text-slate-500" size={24} />;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  return (
    <DashboardLayout agentRunning={agentRunning}>
      <AgentDownloadModal agentRunning={agentRunning} />
      <div onKeyDown={handleKeyDown}>
        {/* Sticky Search Header */}
        <section className="sticky top-14 z-[30] w-full pt-10 pb-6 px-8 flex flex-col items-center backdrop-blur-md bg-background/80 border-b border-white/5 shadow-xl transition-all duration-300">
          <div className="max-w-4xl w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-white/90">
              Architect your workspace.
            </h2>

            {/* Search Bar */}
            <div className="w-full relative group">
              <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full -z-10 group-focus-within:bg-primary/20 transition-all duration-500"></div>
              <div
                className={`glass-panel w-full rounded-2xl border ${
                  searchFocused
                    ? "border-primary/50 shadow-[0_0_30px_rgba(196,192,255,0.15)]"
                    : "border-outline-variant/15"
                } flex items-center px-6 py-4 shadow-2xl transition-all duration-300`}
              >
                <span className="material-symbols-outlined text-primary text-2xl mr-4 drop-shadow-[0_0_8px_rgba(196,192,255,0.5)]">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  className="bg-transparent border-none focus:ring-0 text-xl w-full text-white placeholder:text-on-surface-variant/40 outline-none"
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
                      setQuery("");
                      fetchFiles("", 1);
                    }}
                    className="px-3 text-slate-500 hover:text-white transition-colors"
                  >
                    <FaTimes size={18} />
                  </button>
                )}
                <div className="flex gap-2 ml-4 opacity-50 hidden sm:flex">
                  <kbd className="px-2 py-1 rounded bg-surface-container-highest text-[10px] font-mono text-on-surface-variant border border-outline-variant/20">
                    CMD
                  </kbd>
                  <kbd className="px-2 py-1 rounded bg-surface-container-highest text-[10px] font-mono text-on-surface-variant border border-outline-variant/20">
                    K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mt-6 flex-wrap justify-center">
              <span className="text-[11px] uppercase tracking-[1px] text-on-surface-variant/60 self-center mr-2">
                Filter by
              </span>
              {[
                { key: "pdf", label: "Documents" },
                { key: "png", label: "Images" },
                { key: "folder", label: "Folders" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFileTypeFilter(fileTypeFilter === key ? "" : key)}
                  className={`px-4 py-1.5 rounded-full ${
                    fileTypeFilter === key
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-surface-container-high border-outline-variant/10"
                  } text-white text-xs border hover:border-primary/50 transition-colors shadow-sm`}
                >
                  {label}
                </button>
              ))}
              {(fileTypeFilter || serviceFilter) && (
                <button onClick={resetFilters} className="text-red-400 text-xs px-2 hover:underline ml-2">
                  Clear filters
                </button>
              )}

              {/* Agent Scan Trigger in filters area to save space */}
              <button
                onClick={handleAgentScan}
                disabled={indexingStatus === "indexing" || agentScanning}
                className="ml-4 flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <FaSync className={indexingStatus === "indexing" ? "animate-spin" : ""} size={12} />
                {indexingStatus === "indexing" ? "Scanning..." : "Scan Local"}
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="max-w-6xl mx-auto px-8 pt-12 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {query ? (files.length > 0 ? `Showing results for "${query}"` : "Search Results") : "Recent Activity"}
              </h3>
              <p className="text-xs text-on-surface-variant/60 font-mono mt-1 w-full truncate">
                /workspace/results/page/{currentPage}
              </p>
            </div>
            {loading && (
              <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin shadow-[0_0_8px_rgba(196,192,255,0.8)]"></div>
            )}
          </div>

          {files.length === 0 && !loading && (query || fileTypeFilter || serviceFilter) && (
            <div className="text-center py-20 opacity-50 bg-surface-container-low rounded-2xl border border-white/5 shadow-inner">
              <span className="material-symbols-outlined text-4xl mb-4 text-primary">search_off</span>
              <p className="text-lg">No results found for your query.</p>
            </div>
          )}

          <div
            ref={fileListRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pr-2"
          >
            {files.map((file) => {
              const fileKey = file.filepath || file.cloud_file_id || String(file.id);
              const isSelected = selectedFilePath === fileKey;

              return (
                <div
                  key={fileKey}
                  onClick={() => setSelectedFilePath(isSelected ? null : fileKey)}
                  className={`bg-surface-container-low hover:bg-surface-container-high border ${
                    isSelected
                      ? "border-primary shadow-[0_0_15px_rgba(196,192,255,0.15)] bg-surface-container-highest"
                      : "border-outline-variant/15"
                  } p-5 rounded-xl transition-all duration-300 group cursor-pointer flex flex-col min-h-[180px] h-auto relative overflow-hidden`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_10px_rgba(196,192,255,0.8)]"></div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary text-xl border border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {getFileIcon(file.filepath, file.storage_type)}
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/10 shadow-inner">
                      <span className="material-symbols-outlined text-[14px] text-blue-400">
                        {file.storage_type === "local" ? "desktop_windows" : "cloud"}
                      </span>
                      <span className="text-[10px] font-medium text-slate-300 capitalize">
                        {file.storage_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1 group-hover:text-primary transition-colors drop-shadow-sm">
                    {file.filename}
                  </h4>
                  <p
                    className="text-[11px] font-mono text-on-surface-variant/80 mb-4 truncate w-full"
                    title={file.filepath}
                  >
                    {file.filepath || "Cloud storage"}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/5">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(file.filepath || "");
                        }}
                        className={`hover:scale-125 transition-transform duration-300 ${
                          file.is_favorite
                            ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                            : "text-on-surface-variant/40"
                        }`}
                      >
                        {file.is_favorite ? <FaStar size={14} /> : <FaRegStar size={14} />}
                      </button>
                    </div>

                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      {file.storage_type === "local" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.filepath!, file.filename);
                            }}
                            className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/20"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFileLocation(file.filepath!);
                            }}
                            className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/20"
                            title="Open Location"
                          >
                            <span className="material-symbols-outlined text-[16px]">folder_open</span>
                          </button>
                        </>
                      )}
                      {(file.storage_type === "google_drive" || file.storage_type === "dropbox") && (
                        <a
                          href={
                            file.storage_type === "google_drive"
                              ? `https://drive.google.com/open?id=${file.cloud_file_id}`
                              : `https://www.dropbox.com/home/${file.cloud_file_id}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors border border-indigo-500/20"
                          title="Open Cloud Link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => fetchFiles(query, currentPage - 1)}
                className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show limited pages if many
                  if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                    if (Math.abs(pageNum - currentPage) === 3) return <span key={i} className="text-slate-600 px-1">...</span>;
                    return null;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => fetchFiles(query, pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? "bg-primary text-[#1a1b23] shadow-[0_0_15px_rgba(196,192,255,0.4)]"
                          : "bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => fetchFiles(query, currentPage + 1)}
                className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>

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
