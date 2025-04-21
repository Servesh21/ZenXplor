import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { 
  FaDownload, FaFolderOpen, FaSearch, FaSync, FaCloud, 
  FaFilter, FaTimes, FaFileAlt, FaFilePdf, FaFileWord, 
  FaFileImage, FaFolder, FaEllipsisV, FaCheck, FaChevronDown
} from "react-icons/fa";

interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: "local" | "google_drive" | "dropbox";
  cloud_file_id?: string;
}

const FileSearch: React.FC = () => {
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
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const observer = useRef<IntersectionObserver | null>(null);

  const LIMIT = 10;

  // Fetch search results with filters
  const fetchFiles = async (newQuery = query, newOffset = offset) => {
    if (loading || !newQuery.trim() || !hasMore) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/search/search-files", {
        params: { q: newQuery, offset: newOffset, limit: LIMIT, service: serviceFilter, filetype: fileTypeFilter },
        withCredentials: true,
      });

      const newData = response.data.results;
      setFiles((prev) => (newOffset === 0 ? newData : [...prev, ...newData]));
      setHasMore(response.data.has_more);
      setOffset(newOffset + LIMIT);
    } catch (error) {
      console.error("Search failed:", error);
      if (newOffset === 0) setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.trim()) {
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

  const handleDownload = async (filepath: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/search/download-file?filepath=${encodeURIComponent(filepath)}`, {
        withCredentials: true,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filepath.split("/").pop() || "file");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleOpenFileLocation = async (filepath: string) => {
    try {
      await axios.post("http://localhost:5000/search/open-file", { filepath }, { withCredentials: true });
    } catch (error) {
      console.error("Failed to open file location:", error);
    }
  };

  const handleIndex = async () => {
    setIndexingStatus("indexing");
    try {
      await axios.post("http://localhost:5000/search/index-files", {}, { withCredentials: true });
      setIndexingStatus("completed");
      setTimeout(() => setIndexingStatus("not_started"), 3000);
    } catch (error) {
      console.error("Indexing failed:", error);
      setIndexingStatus("failed");
      setTimeout(() => setIndexingStatus("not_started"), 3000);
    }
  };

  const resetFilters = () => {
    setServiceFilter("");
    setFileTypeFilter("");
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen p-4 transition-colors duration-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <FaSearch className="mr-3" /> File Explorer
            </h2>
            
            <div className="flex items-center space-x-4">
              <button
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
              </button>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-indigo-800 text-white hover:bg-indigo-700 transition-all"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            {/* Search Bar */}
            <div className="relative">
              <div 
                className={`flex border-2 ${searchFocused ? "border-blue-500 shadow-lg" : "border-gray-300 dark:border-gray-600"} rounded-xl overflow-hidden transition-all duration-300`}
              >
                <div className="flex items-center pl-4 text-gray-400 dark:text-gray-500">
                  <FaSearch size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Find files across all your storage..."
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
                <button
                  onClick={() => fetchFiles(query, 0)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center transition-all font-medium"
                >
                  Search
                </button>
              </div>
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
              {(serviceFilter || fileTypeFilter) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {serviceFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Service: {serviceFilter}
                      <button onClick={() => setServiceFilter("")} className="ml-1 text-blue-500 hover:text-blue-700">
                        <FaTimes size={10} />
                      </button>
                    </span>
                  )}
                  
                  {fileTypeFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Type: {fileTypeFilter}
                      <button onClick={() => setFileTypeFilter("")} className="ml-1 text-purple-500 hover:text-purple-700">
                        <FaTimes size={10} />
                      </button>
                    </span>
                  )}
                  
                  <button
                    onClick={resetFilters}
                    className="text-red-500 hover:text-red-700 flex items-center px-3 py-1 rounded-full text-xs bg-red-50 dark:bg-red-900/30"
                  >
                    Clear All
                  </button>
                </div>
              )}
              
              {/* Filter Panel */}
              <div 
                className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ${
                  showFilters ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
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
              </div>
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
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {Math.min(files.length, LIMIT)} of {files.length}
                </div>
              )}
            </div>
            
            {/* File List */}
            <div
              ref={fileListRef}
              className="max-h-96 overflow-y-auto rounded-xl transition-all"
            >
              {files.length > 0 ? (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={file.id}
                      ref={index === files.length - 1 ? lastFileRef : null}
                      className={`rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
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
                            {file.storage_type === "google_drive" ? (
                              <a
                                href={`https://drive.google.com/open?id=${file.cloud_file_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-all"
                                title="Open in Google Drive"
                              >
                                <FaCloud size={18} />
                              </a>
                            ) : file.storage_type === "dropbox" ? (
                              <a
                                href={`https://www.dropbox.com/home/${file.cloud_file_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-800/50 transition-all"
                                title="Open in Dropbox"
                              >
                                <FaCloud size={18} />
                              </a>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file.filepath!);
                                  }}
                                  className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-all"
                                  title="Download file"
                                >
                                  <FaDownload size={18} />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFileLocation(file.filepath!);
                                  }}
                                  className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50 transition-all"
                                  title="Open file location"
                                >
                                  <FaFolderOpen size={18} />
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(selectedFile === file.id ? null : file.id);
                              }}
                              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-all"
                            >
                              <FaEllipsisV size={18} />
                            </button>
                          </div>
                        </div>
                        
                        {/* File Preview/Details (expandable) */}
                        <div className={`mt-4 overflow-hidden transition-all duration-300 ${
                          selectedFile === file.id ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                        }`}>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Info</h4>
                                <ul className="mt-2 space-y-1">
                                  <li className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">ID:</span> {file.id}
                                  </li>
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
                                        onClick={() => handleDownload(file.filepath!)}
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
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="w-24 h-24 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-inner">
                    <FaSearch className="text-gray-400 dark:text-gray-500" size={32} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-6">
                    {query ? "No files found matching your search" : "Enter a search term to find files"}
                  </p>
                  {query && (
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 max-w-sm text-center">
                      Try adjusting your search terms or filters for better results
                    </p>
                  )}
                  {query && (serviceFilter || fileTypeFilter) && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-all"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
              
              {loading && files.length > 0 && (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-10 h-10 border-t-4 border-blue-500 border-r-4 border-gray-200 rounded-full animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Loading more files...</p>
                </div>
              )}
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
};

export default FileSearch;