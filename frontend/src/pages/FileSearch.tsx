import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaDownload, FaFolderOpen, FaSearch, FaSync, FaCloud, FaHdd } from "react-icons/fa";

interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: "local" | "google_drive";
  cloud_file_id?: string; // Only for Google Drive files
}

const FileSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState("not_started");

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
  }
  const handleIndex = async () => {
    setIndexingStatus("indexing");
    try {
      await axios.post("http://localhost:5000/search/index-files", {}, { withCredentials: true });
      setIndexingStatus("completed");
    } catch (error) {
      console.error("Indexing failed:", error);
      setIndexingStatus("failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        File Search
      </h2>

      {/* Index Button */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={handleIndex}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:from-indigo-600 hover:to-blue-700 transition-all"
        >
          <FaSync className={indexingStatus === "indexing" ? "animate-spin" : ""} />
          {indexingStatus === "indexing" ? "Indexing..." : "Index Files"}
        </button>
      </div>

      <div className="relative mb-6">
        <div className="flex">
          <input
            type="text"
            placeholder="Search for files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-l-lg focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 rounded-r-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center"
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
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching files...</p>
          </div>
        ) : files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((file) => (
              <li 
                key={file.id} 
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-lg">{file.filename}</p>
                  {file.filepath && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all">📂 {file.filepath}</p>
                  )}
                  {file.storage_type === "google_drive" ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FaCloud className="text-blue-500" /> Google Drive
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FaHdd className="text-gray-500" /> Local Storage
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  {file.storage_type === "google_drive" ? (
                    <a
                      href={`https://drive.google.com/open?id=${file.cloud_file_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all"
                      title="Open in Google Drive"
                    >
                      <FaCloud size={18} />
                    </a>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleDownload(file.filepath!)} 
                        className="text-blue-500 hover:text-blue-700 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all"
                        title="Download file"
                      >
                        <FaDownload size={18} />
                      </button>
                      <button 
                        onClick={() => handleOpenFileLocation(file.filepath!)} 
                        className="text-green-500 hover:text-green-700 bg-green-100 dark:bg-green-900/30 p-3 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-all"
                        title="Open file location"
                      >
                        <FaFolderOpen size={18} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center">
              <FaSearch className="text-gray-400 dark:text-gray-500" size={24} />
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-lg mt-4">No files found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileSearch;