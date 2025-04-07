// FileSearch.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaDownload, FaFolderOpen, FaSearch, FaSync, FaCloud } from "react-icons/fa";

interface FileItem {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: "local" | "google_drive" | "dropbox" | "google_photos" | "gmail";
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
  const observer = useRef<IntersectionObserver | null>(null);

  const LIMIT = 10;

  const fetchFiles = async (newQuery = query, newOffset = offset) => {
    if (loading || !newQuery.trim() || !hasMore) return;
    setLoading(true);
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

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setOffset(0);
      setHasMore(true);
      fetchFiles(query, 0);
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [query, serviceFilter, fileTypeFilter]);

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
      const response = await axios.get(
        `http://localhost:5000/search/download-file?filepath=${encodeURIComponent(filepath)}`,
        { withCredentials: true, responseType: "blob" }
      );

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

      {/* Filters */}
      <div className="flex justify-between mb-4 flex-col sm:flex-row gap-2">
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="border rounded-lg p-2 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Services</option>
          <option value="local">Local</option>
          <option value="google_drive">Google Drive</option>
          <option value="dropbox">Dropbox</option>
          <option value="google_photos">Google Photos</option>
          <option value="gmail">Gmail</option>
        </select>

        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="border rounded-lg p-2 dark:bg-gray-700 dark:text-white"
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

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="flex">
          <input
            type="text"
            placeholder="Search for files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-l-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => fetchFiles(query, 0)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 rounded-r-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center"
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl mb-4">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">Search Results</span>
          {loading && <div className="ml-3 h-5 w-5 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>}
        </h3>

        <div ref={fileListRef} className="max-h-80 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
          {files.length > 0 ? (
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={file.id}
                  ref={index === files.length - 1 ? lastFileRef : null}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <p className="font-semibold text-lg">{file.filename}</p>
                    {file.filepath && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-all">📂 {file.filepath}</p>
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
                    ) : file.storage_type === "dropbox" ? (
                      <a
                        href={`https://www.dropbox.com/home${file.cloud_file_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-all"
                        title="Open in Dropbox"
                      >
                        <FaCloud size={18} />
                      </a>
                    ) : file.storage_type === "gmail" ? (
                      <a
                        href={`https://mail.google.com/mail/u/0/#search/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-700 bg-red-100 dark:bg-red-900/30 p-3 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-all"
                        title="View in Gmail"
                      >
                        <FaCloud size={18} />
                      </a>
                    ) : file.storage_type === "google_photos" ? (
                      <a
                        href={`https://photos.google.com/search/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-700 bg-pink-100 dark:bg-pink-900/30 p-3 rounded-full hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-all"
                        title="View in Google Photos"
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
    </div>
  );
};

export default FileSearch;
