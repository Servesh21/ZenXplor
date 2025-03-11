import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaDownload, FaFolderOpen, FaSearch, FaSync, FaTimes } from "react-icons/fa";

interface FileItem {
  id: number;
  filename: string;
  filepath: string;
}

const FileSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState("not_started");
  const [error, setError] = useState("");
  const [showReindexDialog, setShowReindexDialog] = useState(false);
  const [reindexProgress, setReindexProgress] = useState(0);

  useEffect(() => {
    let interval: number | null = null;

    const getIndexingStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/search/index-status", { withCredentials: true });
        setIndexingStatus(response.data.status);

        // Update progress based on status
        if (response.data.status === "in_progress") {
          // Simulate progress for visual feedback
          setReindexProgress((prev) => {
            const newProgress = prev + 5;
            return newProgress > 95 ? 95 : newProgress;
          });
        } else if (response.data.status === "completed") {
          setReindexProgress(100);
          setTimeout(() => {
            setShowReindexDialog(false);
            setReindexProgress(0);
          }, 1500);
          
          if (interval !== null) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (error) {
        console.error("Failed to get indexing status:", error);
        if (interval !== null) {
          clearInterval(interval);
          interval = null;
        }
        setShowReindexDialog(false);
      }
    };

    if (indexingStatus === "in_progress" && showReindexDialog) {
      interval = window.setInterval(getIndexingStatus, 3000);
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [indexingStatus, showReindexDialog]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/search/search-files?q=${query}`, {
        withCredentials: true,
      });
      setFiles(response.data);
    } catch (error) {
      console.error("Search failed:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setError("");
    setShowReindexDialog(true);
    setReindexProgress(0);
    
    try {
      await axios.post("http://localhost:5000/search/index-files", {}, { withCredentials: true });
      setIndexingStatus("in_progress");
      setReindexProgress(10); // Start with some progress for visual feedback
    } catch (error: any) {
      console.error("Reindexing failed:", error);
      if (error.response?.status === 401) {
        setError("You must be logged in to reindex files.");
      } else {
        setError("Failed to start reindexing.");
      }
      setShowReindexDialog(false);
    }
  };

  const handleDownload = async (filepath: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/search/download-file?filepath=${encodeURIComponent(filepath)}`, {
        withCredentials: true,
        responseType: "blob", // Ensures proper file download
      });
  
      // Create a URL for the blob and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filepath.split("/").pop() || "file"); // Extract filename from path
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

  const handleCancelReindex = () => {
    // We're just closing the dialog, not actually canceling the backend process
    setShowReindexDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl shadow-lg transition duration-300 border border-gray-100 dark:border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">File Search</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 rounded-md flex items-center">
          <span className="text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="mb-6">
        <button 
          onClick={handleReindex} 
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          disabled={showReindexDialog}
        >
          <FaSync className={indexingStatus === "in_progress" ? "animate-spin" : ""} />
          Reindex Files
        </button>
      </div>

      <div className="relative mb-6">
        <div className="flex">
          <input
            type="text"
            placeholder="Search for files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 rounded-r-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center"
          >
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl mb-4">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">Search Results</span>
          {loading && <div className="ml-3 h-5 w-5 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>}
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Searching files...</p>
          </div>
        ) : files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((file) => (
              <li 
                key={file.id} 
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transform hover:-translate-y-1"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-lg">{file.filename}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{file.filepath}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleDownload(file.filepath)} 
                    className="text-blue-500 hover:text-blue-700 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all"
                    title="Download file"
                  >
                    <FaDownload size={18} />
                  </button>
                  <button 
                    onClick={() => handleOpenFileLocation(file.filepath)} 
                    className="text-green-500 hover:text-green-700 bg-green-100 dark:bg-green-900/30 p-3 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-all"
                    title="Open file location"
                  >
                    <FaFolderOpen size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 flex items-center justify-center">
              <FaSearch className="text-gray-400 dark:text-gray-500" size={24} />
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-lg">No files found.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try a different search term or reindex your files.</p>
          </div>
        )}
      </div>

      {/* Reindex Dialog */}
      {showReindexDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm transition-all duration-300 opacity-100">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Indexing Files</h3>
              <button 
                onClick={handleCancelReindex}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="mb-8">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:bg-blue-900/30">
                      {reindexProgress === 100 ? "Complete" : "In Progress"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                      {reindexProgress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                  <div 
                    style={{ width: `${reindexProgress}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out ${
                      reindexProgress === 100 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                        : "bg-gradient-to-r from-blue-500 to-indigo-600"
                    }`}
                  ></div>
                </div>
              </div>
              
              {reindexProgress < 100 && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <div className="mr-2 h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                  Scanning and indexing your files...
                </div>
              )}
              
              {reindexProgress === 100 && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-2">
                  <div className="mr-2 h-3 w-3 bg-green-500 rounded-full"></div>
                  Indexing complete! Your files are ready to search.
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleCancelReindex} 
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  reindexProgress === 100
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {reindexProgress === 100 ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSearch;