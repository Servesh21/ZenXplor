import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { 
  FaDownload, FaFolderOpen, FaSearch, FaSync, FaCloud, 
  FaFilter, FaTimes, FaFileAlt, FaFilePdf, FaFileWord, 
  FaFileImage, FaFolder, FaCheck, FaChevronDown,
  FaStar, FaSortAmountDown,
  FaRegStar
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";


interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: string;
  cloud_file_id?: string;
  is_favorite: boolean;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const [sortOrder, setSortOrder] = useState<"name" | "type" | "storage">("name");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const observer = useRef<IntersectionObserver | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const LIMIT = 10;





  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:5000/auth/check-auth", { 
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

  // Fetch search results with filters
  const fetchFiles = async (newQuery = query, newOffset = offset) => {
    if (loading || (!newQuery.trim() && !serviceFilter && !fileTypeFilter) || !hasMore) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/search/search-files", {
        params: { q: newQuery, offset: newOffset, limit: LIMIT, service: serviceFilter, filetype: fileTypeFilter },
        withCredentials: true,
      });
      console.log("Search response:", response.data);
      const newData = response.data.results;
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
    (node: HTMLLIElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            fetchFiles(query, offset);
          }
        },
        { root: fileListRef.current, threshold: 1 }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, query, offset]
  );

  const handleDownload = async (filepath: string, filename: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/search/download-file?filepath=${encodeURIComponent(filepath)}`, {
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
    try {
      await axios.post("http://localhost:5000/search/open-file", { filepath }, { withCredentials: true });
      showToastNotification("Opening file location");
    } catch (error) {
      
      showToastNotification("Opening file location");
    }
  };

  const handleIndex = async () => {
    setIndexingStatus("indexing");
    try {
      await axios.post("http://localhost:5000/search/index-files", {}, { withCredentials: true });
      setIndexingStatus("completed");
      showToastNotification("Files indexed successfully");
      setTimeout(() => setIndexingStatus("not_started"), 3000);
    } catch (error) {
      console.error("Indexing failed:", error);
      setIndexingStatus("failed");
      showToastNotification("Indexing failed. Please try again.");
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
        `http://localhost:5000/search/${encodeURIComponent(filepath)}/favorite`,{}, { withCredentials: true }
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
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  const getSortedFiles = () => {
    if (!files.length) return [];
    
    return [...files].sort((a, b) => {
      if (sortOrder === "name") {
        return a.filename.localeCompare(b.filename);
      } else if (sortOrder === "type") {
        const typeA = a.filepath?.split('.').pop() || "";
        const typeB = b.filepath?.split('.').pop() || "";
        return typeA.localeCompare(typeB);
      } else {
        return a.storage_type.localeCompare(b.storage_type);
      }
    });
  };

  const sortedFiles = getSortedFiles();

  return (
    <div 
      className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-6xl mx-auto p-4">
        <div className="rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <FaSearch className="mr-3" />
              
            </h2>
            
            <div className="flex items-center space-x-4">

              
              <motion.div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" 
                      ? "bg-white text-indigo-700" 
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  aria-label="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" 
                      ? "bg-white text-indigo-700" 
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  aria-label="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </motion.button>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleIndex}
                disabled={indexingStatus === "indexing"}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium shadow-lg ${
                  indexingStatus === "indexing" 
                    ? "bg-indigo-700 text-indigo-200" 
                    : indexingStatus === "completed" 
                      ? "bg-green-500 text-white" 
                      : indexingStatus === "failed" 
                        ? "bg-red-500 text-white" 
                        : "bg-white text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <FaSync className={indexingStatus === "indexing" ? "animate-spin" : ""} size={14} />
                {indexingStatus === "indexing" 
                  ? "Indexing..." 
                  : indexingStatus === "completed" 
                    ? <><FaCheck className="mr-1" /> Indexed</> 
                    : indexingStatus === "failed" 
                      ? "Failed" 
                      : "Index Files"}
              </motion.button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            {/* Search Bar */}
            <div className="relative">
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex border-2 ${searchFocused ? "border-blue-500 shadow-lg" : "border-gray-300 dark:border-gray-600"} rounded-xl overflow-hidden transition-all duration-300`}
              >
                <div className="flex items-center pl-4 text-gray-400 dark:text-gray-500">
                  <FaSearch size={18} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Find files across all your storage... (Ctrl+F)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full py-4 px-3 bg-transparent text-gray-900 dark:text-white focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <FaTimes size={18} />
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fetchFiles(query, 0)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center transition-all font-medium"
                >
                  Search
                </motion.button>
              </motion.div>
            </div>
            
            {/* Filters */}
            <div className="mt-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-sm font-medium"
              >
                <FaFilter className="mr-2" size={12} />
                {showFilters ? "Hide Filters" : "Show Filters"}
                <FaChevronDown className={`ml-1 transform transition-transform ${showFilters ? "rotate-180" : ""}`} size={12} />
              </button>
              
              {/* Active Filters Display */}
              <AnimatePresence>
                {(serviceFilter || fileTypeFilter) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 flex flex-wrap gap-2"
                  >
                    {serviceFilter && (
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        Service: {serviceFilter}
                        <button onClick={() => setServiceFilter("")} className="ml-1 text-blue-500 hover:text-blue-700">
                          <FaTimes size={10} />
                        </button>
                      </motion.span>
                    )}
                    
                    {fileTypeFilter && (
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        Type: {fileTypeFilter}
                        <button onClick={() => setFileTypeFilter("")} className="ml-1 text-purple-500 hover:text-purple-700">
                          <FaTimes size={10} />
                        </button>
                      </motion.span>
                    )}
                    
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetFilters}
                      className="text-red-500 hover:text-red-700 flex items-center px-3 py-1 rounded-full text-xs bg-red-50 dark:bg-red-900/30"
                    >
                      Clear All
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Storage Service</label>
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full border-0 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">All Services</option>
                        <option value="local">Local Storage</option>
                        <option value="google_drive">Google Drive</option>
                        <option value="dropbox">Dropbox</option>
                        <option value="google_photos">Google Photos</option>
                        <option value="gmail">Gmail Attachments</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Type</label>
                      <select
                        value={fileTypeFilter}
                        onChange={(e) => setFileTypeFilter(e.target.value)}
                        className="w-full border-0 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">All File Types</option>
                        <option value="pdf">PDF Documents</option>
                        <option value="docx">Word Documents</option>
                        <option value="txt">Text Files</option>
                        <option value="jpg">JPG Images</option>
                        <option value="png">PNG Images</option>
                        <option value="folder">Folders</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "name" | "type" | "storage")}
                        className="w-full border-0 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="name">Filename (A-Z)</option>
                        <option value="type">File Type</option>
                        <option value="storage">Storage Service</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Search Results */}
          <div className="px-8 py-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center text-gray-800 dark:text-gray-200">
                {files.length > 0 ? `Found ${files.length} ${files.length === 1 ? 'file' : 'files'}` : 'Search Results'}
                {loading && files.length === 0 && (
                  <div className="ml-3 h-5 w-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                )}
              </h3>
              
              {files.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {Math.min(files.length, LIMIT)} of {files.length}
                  </span>
                  <button
                    onClick={() => setSortOrder(prev => prev === "name" ? "type" : prev === "type" ? "storage" : "name")}
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Change sort order"
                  >
                    <FaSortAmountDown size={14} />
                  </button>
                </div>
              )}
            </div>
            
            {/* File List */}
            <div
              ref={fileListRef}
              className="max-h-screen-sm overflow-y-auto rounded-xl transition-all"
            >
              {sortedFiles.length > 0 ? (
                viewMode === "list" ? (
                  <ul className="space-y-2">
                    {sortedFiles.map((file, index) => (
                      <motion.li
                        key={file.id}
                        ref={index === sortedFiles.length - 1 ? lastFileRef : null}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden ${
                          selectedFile === file.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedFile(selectedFile === file.id ? null : file.id)}
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                              {getFileIcon(file.filepath, file.storage_type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-1 gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  file.storage_type === "google_drive" 
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" 
                                    : file.storage_type === "dropbox" 
                                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                }`}>
                                  {file.storage_type}
                                </span>
                                
                                {file.filepath && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 font-medium">
                                    {file.filepath?.split('.').pop() || "file"}
                                  </span>
                                )}
                              </div>
                              
                              <p className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                                {file.filename}
                              </p>
                              
                              {file.filepath && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                  {file.filepath}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0 flex space-x-2">
                            {file.storage_type === "local" &&(                          
                                <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  file.filepath && handleDownload(file.filepath, file.filename);
                                }}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Download"
                              >
                                <FaDownload size={16} />
                              </motion.button>) }

                              
                              {file.filepath && file.storage_type==="local" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFileLocation(file.filepath!);
                                  }}
                                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                  title="Open file location"
                                >
                                  <FaFolderOpen size={16} />
                                </motion.button>
                              )}


                              {(file.storage_type === "google_drive" ||file.storage_type==="dropbox") && (
                                <motion.a
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={file.storage_type === "google_drive" 
                                    ? `https://drive.google.com/open?id=${file.cloud_file_id}`
                                    : `https://www.dropbox.com/home/${file.cloud_file_id}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                  title="Open in cloud storage"
                                >
                                  <FaCloud size={16} />
                                </motion.a>
                                )}
                              
                              <motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  onClick={(e) => {
    e.stopPropagation();
    console.log("Toggle favorite for file ID:", file.filepath!);
    toggleFavorite(file.filepath!);
  }}
  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
    file.is_favorite ? "text-yellow-400" : "text-gray-600 dark:text-gray-300"
  }`}
  title="Add to favorites"
>
  {file.is_favorite?<FaStar size={16} />:<FaRegStar size={16} />}
</motion.button>

                            </div>
                          </div>
                          
                          {/* Expanded actions when a file is selected */}
                          <AnimatePresence>
                            {selectedFile === file.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
                              >
                        <div className={`mt-4 overflow-hidden transition-all duration-300 ${
                          selectedFile === file.id ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                        }`}>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Info</h4>
                                <ul className="mt-2 space-y-1">
                                  <li className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Type:</span> {file.filepath?.split('.').pop()?.toUpperCase() || "Unknown"}
                                  </li>
                                  <li className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Storage:</span> {file.storage_type}
                                  </li>
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Actions</h4>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {file.storage_type === "local" && (
                                    <>
                                      <button
                                        onClick={() => handleDownload(file.filepath!,file.filename)}
                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                                      >
                                        Download
                                      </button>
                                      <button
                                        onClick={() => handleOpenFileLocation(file.filepath!)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-all"
                                      >
                                        Open Location
                                      </button>
                                    </>
                                  )}
                                  {(file.storage_type === "google_drive" || file.storage_type === "dropbox") && (
                                    <a
                                      href={file.storage_type === "google_drive" 
                                        ? `https://drive.google.com/open?id=${file.cloud_file_id}`
                                        : `https://www.dropbox.com/home/${file.cloud_file_id}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all"
                                    >
                                      Open in {file.storage_type === "google_drive" ? "Google Drive" : "Dropbox"}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  // Grid View
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedFiles.map((file, index) => (
                      <motion.div
                        key={file.id}
                        ref={index === sortedFiles.length - 1 ? lastFileRef : null}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`bg-white dark:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full flex flex-col ${
                          selectedFile === file.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedFile(selectedFile === file.id ? null : file.id)}
                      >
                        <div className="p-4 flex-1">
                          <div className="flex justify-center items-center h-28 w-full bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
                            {getFileIcon(file.filepath, file.storage_type)}
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center mb-2 gap-1 flex-wrap">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                file.storage_type === "google_drive" 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" 
                                  : file.storage_type === "dropbox" 
                                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              }`}>
                                {file.storage_type}
                              </span>
                              
                              {file.filepath && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 font-medium">
                                  {file.filepath?.split('.').pop() || "file"}
                                </span>
                              )}
                            </div>
                            
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {file.filename}
                            </p>
                            
                            {file.filepath && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {file.filepath}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 p-3 flex justify-between mt-auto">
                        <motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  onClick={(e) => {
    e.stopPropagation();
    console.log("Toggle favorite for file ID:", file.filepath!);
    toggleFavorite(file.filepath!);
  }}
  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
    file.is_favorite ? "text-yellow-400" : "text-gray-600 dark:text-gray-300"
  }`}
  title="Add to favorites"
>
  {file.is_favorite?<FaStar size={14} />:<FaRegStar size={14} />}
</motion.button>

                          
                          {file.filepath && file.storage_type==="local" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFileLocation(file.filepath!);
                                  }}
                                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                  title="Open file location"
                                >
                                  <FaFolderOpen size={14} />
                                </motion.button>
                              )}


                              {(file.storage_type === "google_drive" ||file.storage_type==="dropbox") && (
                                <motion.a
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={file.storage_type === "google_drive" 
                                    ? `https://drive.google.com/open?id=${file.cloud_file_id}`
                                    : `https://www.dropbox.com/home/${file.cloud_file_id}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                  title="Open in cloud storage"
                                >
                                  <FaCloud size={14} />
                                </motion.a>
                                )}
                          
                          {file.storage_type === "local" &&(                          
                                <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  file.filepath && handleDownload(file.filepath, file.filename);
                                }}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Download"
                              >
                                <FaDownload size={14} />
                              </motion.button>) }
                          
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : query.trim() || serviceFilter || fileTypeFilter ? (
                    <>
                      <div className="text-gray-400 dark:text-gray-500 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No files found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                        We couldn't find any files matching your search criteria. Try adjusting your search or filters.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-400 dark:text-gray-500 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Start searching</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                        Enter a search term above to find files across all your connected storage services.
                      </p>
                    </>
                  )}
                </div>
              )}
              
              {/* Loading more indicator */}
              {loading && files.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center">
              <FaCheck className="mr-2 text-green-400" />
              <p>{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileSearch;