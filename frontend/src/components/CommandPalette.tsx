import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL, AGENT_URL } from "../api";

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

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  agentRunning: boolean;
}

const pathToId = (fp: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < fp.length; i++) {
    h ^= fp.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return -(h % 2_000_000_000 || 1);
};

const getFileIcon = (filePath: string = "", storageType: string) => {
  if (storageType === "google_drive" || storageType === "dropbox") return "cloud";
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf": return "picture_as_pdf";
    case "doc": case "docx": return "description";
    case "jpg": case "jpeg": case "png": case "gif": return "image";
    case "xlsx": case "xls": return "table_view";
    default: return "article";
  }
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, agentRunning }) => {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedFileDetails, setSelectedFileDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [toast, setToast] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchRecentSearches();
      fetchFiles("", 1);
    } else {
      setQuery("");
      setFiles([]);
      setActiveIndex(0);
      setSelectedFileDetails(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      fetchFiles(query, 1);
      if (query.trim()) setTimeout(fetchRecentSearches, 1000);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset active index on results change
  useEffect(() => { setActiveIndex(0); }, [files]);

  // Fetch preview for active file
  useEffect(() => {
    if (!isOpen || files.length === 0) { setSelectedFileDetails(null); return; }
    const file = files[activeIndex];
    if (!file) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/search/file-details`, {
          params: { id: file.id, filepath: file.filepath },
          withCredentials: true,
        });
        const details = res.data;
        if (details.preview_url === "local_agent_preview" && agentRunning) {
          details.preview_url = `${AGENT_URL}/preview?filepath=${encodeURIComponent(file.filepath || "")}`;
        }
        setSelectedFileDetails(details);
      } catch {
        setSelectedFileDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [activeIndex, files, isOpen]);

  const fetchRecentSearches = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/search/recent-searches`, { withCredentials: true });
      setRecentSearches(res.data.recent_searches || []);
    } catch { /* ignore */ }
  };

  const fetchFiles = async (q: string, page: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/search/search-files`, {
        params: { q, offset: 0, limit: 8 },
        withCredentials: true,
      });
      let data: FileItem[] = res.data.results;

      if (page === 1 && agentRunning && q.trim()) {
        try {
          const agentRes = await axios.get(`${AGENT_URL}/search`, {
            params: { q, limit: 5 }, timeout: 2000,
          });
          const seen = new Set(data.map(f => f.filepath));
          const agentItems: FileItem[] = (agentRes.data.results || [])
            .filter((r: any) => !seen.has(r.filepath))
            .map((r: any) => ({
              id: pathToId(r.filepath), filename: r.filename, filepath: r.filepath,
              storage_type: "local", is_favorite: false, filetype: r.filetype, last_modified: r.last_modified,
            }));
          data = [...agentItems, ...data];
        } catch { /* agent offline */ }
      }
      setFiles(data);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleOpen = useCallback(async (file: FileItem) => {
    if (file.storage_type === "local") {
      if (!agentRunning) { showToast("Agent not running"); return; }
      try {
        await axios.post(`${AGENT_URL}/open`, { filepath: file.filepath }, { timeout: 5000 });
        showToast("Opening file…");
        onClose();
      } catch { showToast("Could not open file"); }
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/search/open-file`, { filepath: file.filepath, id: file.id }, { withCredentials: true });
      if (res.data.url) window.open(res.data.url, "_blank");
      onClose();
    } catch { showToast("Failed to open file"); }
  }, [agentRunning, onClose]);

  const handleDownload = useCallback(async (file: FileItem) => {
    if (file.storage_type === "local") {
      if (!agentRunning) { showToast("Agent not running"); return; }
      const link = document.createElement("a");
      link.href = `${AGENT_URL}/download?filepath=${encodeURIComponent(file.filepath || "")}`;
      link.setAttribute("download", file.filename);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      showToast(`Downloading ${file.filename}`);
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_URL}/search/download-file`, {
        params: { filepath: file.filepath, id: file.id }, withCredentials: true, responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", file.filename);
      document.body.appendChild(link); link.click(); link.remove();
      showToast("Download started");
    } catch { showToast("Download failed"); }
  }, [agentRunning]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, files.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && files[activeIndex]) {
      e.preventDefault();
      handleOpen(files[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="cmd-modal"
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[201] flex items-start justify-center pt-[12vh] px-4"
            onClick={onClose}
          >
            <div
              onClick={e => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              className="w-full max-w-[820px] bg-[#13141C] border border-[#2A2C3E] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
              style={{ maxHeight: "70vh" }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E2030]">
                <span className="material-symbols-outlined text-primary text-xl">search</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search files across all platforms…"
                  className="flex-1 bg-transparent text-[15px] text-on-surface placeholder:text-on-surface-variant/40 outline-none font-medium"
                />
                {loading && <div className="w-4 h-4 border-t-2 border-primary rounded-full animate-spin" />}
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-[#1E2030] text-on-surface-variant/60 rounded text-[10px] font-mono border border-[#2A2C3E]">ESC</kbd>
              </div>

              {/* Recent Searches (shown when no query) */}
              {!query && recentSearches.length > 0 && (
                <div className="px-5 py-3 border-b border-[#1E2030]">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/40 mb-2">Recent Searches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s, i) => (
                      <button key={i} onClick={() => setQuery(s)}
                        className="px-2.5 py-1 rounded-lg bg-[#1A1B26] border border-[#2A2C3E] text-[11px] text-on-surface-variant hover:border-primary/50 hover:text-on-surface transition-all flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px]">history</span>{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results + Preview Split */}
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Results List */}
                <div ref={listRef} className={`overflow-y-auto py-2 ${selectedFileDetails ? "w-[55%] border-r border-[#1E2030]" : "w-full"}`}>
                  {files.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                      <p className="text-sm">{query ? "No files found" : "Start typing to search"}</p>
                    </div>
                  )}
                  {files.map((file, idx) => {
                    const isActive = idx === activeIndex;
                    const icon = getFileIcon(file.filepath, file.storage_type);
                    const ext = (file.filetype || file.filepath?.split(".").pop() || "FILE").toUpperCase();
                    return (
                      <div
                        key={file.filepath || file.cloud_file_id || file.id}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleOpen(file)}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors duration-100 ${
                          isActive ? "bg-primary/8 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-[#1A1B26]"
                        }`}
                      >
                        <div className={`w-9 h-9 shrink-0 rounded-lg flex flex-col items-center justify-center ${
                          isActive ? "bg-primary/15 border border-primary/25" : "bg-[#1A1B26] border border-[#2A2C3E]"
                        }`}>
                          <span className={`material-symbols-outlined text-base ${isActive ? "text-primary" : "text-on-surface-variant/60"}`}>{icon}</span>
                          <span className={`text-[7px] font-black uppercase ${isActive ? "text-primary" : "text-on-surface-variant/50"}`}>{ext.substring(0, 4)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${isActive ? "text-on-surface" : "text-on-surface/80"}`}>{file.filename}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-on-surface-variant/40 truncate max-w-[200px]">{file.filepath}</span>
                            <span className={`px-1 py-px text-[8px] font-bold rounded uppercase border ${
                              file.storage_type === "google_drive" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                              file.storage_type === "dropbox" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>{file.storage_type.replace("_", " ")}</span>
                          </div>
                        </div>
                        {isActive && (
                          <span className="text-[10px] text-on-surface-variant/40 font-mono shrink-0">↵ open</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Preview Panel */}
                {selectedFileDetails && (
                  <div className="w-[45%] overflow-y-auto p-5 space-y-5">
                    {loadingDetails ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="h-6 w-6 border-t-2 border-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* File Header */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                              <span className="material-symbols-outlined text-primary text-lg">{getFileIcon(selectedFileDetails.filepath, selectedFileDetails.storage_type)}</span>
                              <span className="text-[8px] font-black text-primary uppercase">{(selectedFileDetails.filetype || "FILE").substring(0, 4)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-on-surface truncate">{selectedFileDetails.filename}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-px bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded uppercase border border-blue-500/20">
                                  {selectedFileDetails.storage_type?.replace("_", " ")}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/50">{selectedFileDetails.last_modified}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview Thumbnail */}
                        <div className="aspect-[16/10] bg-[#1A1B26] rounded-xl border border-[#2A2C3E] overflow-hidden flex items-center justify-center">
                          {selectedFileDetails.preview_url ? (
                            <img src={selectedFileDetails.preview_url} alt="Preview" className="w-full h-full object-cover opacity-80"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <span className="material-symbols-outlined text-5xl text-on-surface-variant/15">{getFileIcon(selectedFileDetails.filepath, selectedFileDetails.storage_type)}</span>
                          )}
                        </div>

                        {/* Properties */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/40">Properties</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] text-on-surface-variant/50 uppercase font-semibold">Size</p>
                              <p className="text-xs font-mono text-on-surface">{selectedFileDetails.size || "Unknown"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-on-surface-variant/50 uppercase font-semibold">Type</p>
                              <p className="text-xs font-mono text-on-surface capitalize">{selectedFileDetails.filetype || "Document"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] text-on-surface-variant/50 uppercase font-semibold">Path</p>
                              <p className="text-[11px] font-mono text-on-surface/70 break-all">{selectedFileDetails.filepath}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-2 border-t border-[#1E2030]">
                          <button onClick={() => { handleOpen(files[activeIndex]); }}
                            className="w-full bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] py-2.5 rounded-lg text-[#1b0091] font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                            <span className="material-symbols-outlined text-base">open_in_new</span>Open File
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleDownload(files[activeIndex])}
                              className="py-2 bg-[#1A1B26] border border-[#2A2C3E] rounded-lg text-on-surface font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#20212E] transition-colors">
                              <span className="material-symbols-outlined text-sm">download</span>Download
                            </button>
                            <button onClick={() => {
                              navigator.clipboard.writeText(selectedFileDetails.filepath || "");
                              showToast("Copied path!");
                            }}
                              className="py-2 bg-transparent border border-[#2A2C3E] rounded-lg text-on-surface-variant font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#1A1B26] hover:text-on-surface transition-colors">
                              <span className="material-symbols-outlined text-sm">content_copy</span>Copy Path
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#1E2030] bg-[#0D0E14]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                    <kbd className="px-1 py-px bg-[#1A1B26] rounded text-[9px] border border-[#2A2C3E]">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                    <kbd className="px-1 py-px bg-[#1A1B26] rounded text-[9px] border border-[#2A2C3E]">↵</kbd> open
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                    <kbd className="px-1 py-px bg-[#1A1B26] rounded text-[9px] border border-[#2A2C3E]">esc</kbd> close
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant/30 font-mono">{files.length} results</span>
              </div>
            </div>
          </motion.div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-[#1E2030] text-on-surface border border-[#2A2C3E] px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <p className="text-xs font-medium">{toast}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
