import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaDownload, FaFolderOpen, FaSearch, FaSync, FaCloud, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: "local" | "google_drive" | "dropbox" | "google_photos" | "gmail";
  cloud_file_id?: string;
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
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const LIMIT = 10;

  // Check authentication on component mount
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

  const fetchFiles = async (newQuery = query, newOffset = offset) => {
    if (loading || !newQuery.trim()) return;
    
    // Reset hasMore if this is a new search
    if (newOffset === 0) {
      setHasMore(true);
    }
    
    // Don't fetch if we know there are no more results
    if (newOffset > 0 && !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("http://localhost:5000/search/search-files", {
        params: {
          q: newQuery,
          offset: newOffset,
          limit: LIMIT,
          service: serviceFilter,
          filetype: fileTypeFilter,
        },
        withCredentials: true,
      });

      // Validate response data
      if (response.data && Array.isArray(response.data.results)) {
        const newData = response.data.results;
        
        // Update files safely
        setFiles(prev => {
          if (newOffset === 0) {
            return newData;
          } else {
            // Filter out any duplicates when appending
            const existingIds = new Set(prev.map(file => file.id));
            const uniqueNewFiles = newData.filter((file: { id: number; }) => !existingIds.has(file.id));
            return [...prev, ...uniqueNewFiles];
          }
        });
        
        setHasMore(response.data.has_more === true);
        setOffset(newOffset + LIMIT);
      } else {
        console.error("Invalid response format:", response.data);
        setError("Server returned an invalid response format");
        if (newOffset === 0) setFiles([]);
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      
      // Check for auth errors
      if (error.response && error.response.status === 401) {
        navigate("/login");
        return;
      }
      
      setError(error.response?.data?.message || "Failed to fetch search results");
      if (newOffset === 0) setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Use a more conservative debounce for search
  useEffect(() => {
    let delaySearch: ReturnType<typeof setTimeout>;
    
    if (query.trim()) {
      delaySearch = setTimeout(() => {
        setOffset(0);
        fetchFiles(query, 0);
      }, 600);
    } else {
      setFiles([]);
    }
    
    return () => {
      if (delaySearch) clearTimeout(delaySearch);
    };
  }, [query, serviceFilter, fileTypeFilter]);

  const fileListRef = useRef<HTMLDivElement>(null);
  
  const lastFileRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading || !hasMore) return;
      
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            fetchFiles(query, offset);
          }
        },
        { root: null, rootMargin: '100px', threshold: 0.1 }
      );
      
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, query, offset]
  );

  const handleDownload = async (filepath: string) => {
    if (!filepath) return;
    
    try {
      const response = await axios.get(
        `http://localhost:5000/search/download-file?filepath=${encodeURIComponent(filepath)}`,
        { withCredentials: true, responseType: "blob" }
      );

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filepath.split("/").pop() || "file");
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      console.error("Failed to download file:", error);
      
      if (error.response && error.response.status === 401) {
        navigate("/login");
        return;
      }
      
      // setError("Failed to download file");
    }
  };

  const handleOpenFileLocation = async (filepath: string) => {
    if (!filepath) return;
    
    try {
      const response = await axios.post(
        "http://localhost:5000/search/open-file", 
        { filepath }, 
        { withCredentials: true }
      );
      
      if (response.status === 401) {
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Failed to open file location:", error);
      
      if (error.response && error.response.status === 401) {
        navigate("/login");
        return;
      }
      
      // setError("Failed to open file location");
    }
  };

  const handleIndex = async () => {
    setIndexingStatus("indexing");
    setError(null);
    
    try {
      const response = await axios.post(
        "http://localhost:5000/search/index-files", 
        {}, 
        { withCredentials: true }
      );
      
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      
      setIndexingStatus("completed");
      setTimeout(() => {
        setIndexingStatus("not_started");
      }, 3000);
    } catch (error: any) {
      console.error("Indexing failed:", error);
      
      if (error.response && error.response.status === 401) {
        navigate("/login");
        return;
      }
      
      setIndexingStatus("failed");
      setError("Failed to index files");
      setTimeout(() => {
        setIndexingStatus("not_started");
      }, 3000);
    }
  };

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case "google_drive":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "dropbox":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "google_photos":
        return "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400";
      case "gmail":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  // Safe rendering helper
  const renderFileList = () => {
    if (loading && files.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (files.length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center">
            <FaSearch className="text-gray-400 dark:text-gray-500" size={24} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
            {query.trim() ? "No files found matching your search." : "Enter a search term to find files."}
          </p>
          {query.trim() && !loading && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Try adjusting your search or filters for better results.
            </p>
          )}
        </div>
      );
    }
    
    return (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {files.map((file, index) => (
          <li
            key={`${file.id}-${index}`}
            ref={index === files.length - 1 ? lastFileRef : null}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-lg ${getStorageIcon(file.storage_type)}`}>
                  {file.storage_type === "local" ? (
                    <FaFolderOpen size={18} />
                  ) : (
                    <FaCloud size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {file.filename}
                  </p>
                  {file.filepath && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-md">
                      {file.filepath}
                    </p>
                  )}
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {file.storage_type? file.storage_type:"Local Storage"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                {file.storage_type === "google_drive" ? (
                  <a
                    href={`https://drive.google.com/open?id=${file.cloud_file_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 p-2 rounded-lg transition-all flex items-center gap-2"
                    title="Open in Google Drive"
                  >
                    <FaCloud size={16} />
                    <span className="text-sm">Open</span>
                  </a>
                ) : file.storage_type === "dropbox" ? (
                  <a
                    href={`https://www.dropbox.com/home/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/40 p-2 rounded-lg transition-all flex items-center gap-2"
                    title="Open in Dropbox"
                  >
                    <FaCloud size={16} />
                    <span className="text-sm">Open</span>
                  </a>
                ) : file.storage_type === "gmail" ? (
                  <a
                    href={`https://mail.google.com/mail/u/0/#search/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/40 p-2 rounded-lg transition-all flex items-center gap-2"
                    title="View in Gmail"
                  >
                    <FaCloud size={16} />
                    <span className="text-sm">Open</span>
                  </a>
                ) : file.storage_type === "google_photos" ? (
                  <a
                    href={`https://photos.google.com/search/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-800/40 p-2 rounded-lg transition-all flex items-center gap-2"
                    title="View in Google Photos"
                  >
                    <FaCloud size={16} />
                    <span className="text-sm">Open</span>
                  </a>
                ) : (
                  <>
                    <button
                      onClick={() => file.filepath && handleDownload(file.filepath)}
                      className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 p-2 rounded-lg transition-all flex items-center gap-2"
                      title="Download file"
                      disabled={!file.filepath}
                    >
                      <FaDownload size={16} />
                      <span className="text-sm">Download</span>
                    </button>
                    <button
                      onClick={() => file.filepath && handleOpenFileLocation(file.filepath)}
                      className="text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-800/40 p-2 rounded-lg transition-all flex items-center gap-2"
                      title="Open file location"
                      disabled={!file.filepath}
                    >
                      <FaFolderOpen size={16} />
                      <span className="text-sm">Open</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">
        <span className="text-blue-600 dark:text-blue-400">Universal File Search</span>
      </h2>

      {/* Search and Controls Bar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="flex">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              showFilters
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <FaFilter size={14} />
            <span>Filters</span>
          </button>

          {/* Index Button */}
          <button
            onClick={handleIndex}
            disabled={indexingStatus === "indexing"}
            className={`px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              indexingStatus === "indexing"
                ? "bg-gray-400 dark:bg-gray-700 text-white cursor-not-allowed"
                : indexingStatus === "completed"
                ? "bg-green-600 text-white hover:bg-green-700"
                : indexingStatus === "failed"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <FaSync className={indexingStatus === "indexing" ? "animate-spin" : ""} />
            {indexingStatus === "indexing"
              ? "Indexing..."
              : indexingStatus === "completed"
              ? "Indexed!"
              : indexingStatus === "failed"
              ? "Failed"
              : "Index Files"}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Storage Service</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Services</option>
                <option value="local">Local</option>
                <option value="google_drive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
                <option value="google_photos">Google Photos</option>
                <option value="gmail">Gmail</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Type</label>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All File Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="folder">FOLDER</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Results Section */}
      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="text-green-600 dark:text-green-400">
              Search Results
            </span>
            {files.length > 0 && <span className="ml-3 text-sm text-gray-500">({files.length} found)</span>}
          </h3>
          {loading && files.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Loading more...</span>
            </div>
          )}
        </div>

        <div
          ref={fileListRef}
          className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-inner"
        >
          {renderFileList()}
        </div>
      </div>
    </div>
  );
};

export default FileSearch;