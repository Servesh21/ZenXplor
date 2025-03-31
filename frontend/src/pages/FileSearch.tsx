import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaDownload, FaFolderOpen, FaSearch, FaSync, FaCloud, FaHdd } from "react-icons/fa";

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
  const observer = useRef<IntersectionObserver | null>(null);

  const LIMIT = 10;

  // Fetch search results
  const fetchFiles = async (newQuery = query, newOffset = offset) => {
    if (loading || !newQuery.trim() || !hasMore) return;
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/search/search-files", {
        params: { q: newQuery, offset: newOffset, limit: LIMIT },
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
      setOffset(0);
      setHasMore(true);
      fetchFiles(query, 0);
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [query]);

  // Infinite scrolling observer
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
        { threshold: 1 }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, query, offset]
  );

  // Index files
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

  // Download file
  const handleDownload = async (filepath: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/search/download-file`, {
        params: { filepath },
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

  // Open file location
  const handleOpenFileLocation = async (filepath: string) => {
    try {
      await axios.post("http://localhost:5000/search/open-file", { filepath }, { withCredentials: true });
    } catch (error) {
      console.error("Failed to open file location:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        File Search
      </h2>

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
          />
          <button 
            onClick={() => fetchFiles(query, 0)}
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
                  {file.filepath && <p className="text-sm text-gray-600 dark:text-gray-400 break-all">📂 {file.filepath}</p>}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleDownload(file.filepath!)} className="text-blue-500 hover:text-blue-700">
                    <FaDownload size={18} />
                  </button>
                  <button onClick={() => handleOpenFileLocation(file.filepath!)} className="text-green-500 hover:text-green-700">
                    <FaFolderOpen size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center">No files found.</p>
        )}
      </div>
    </div>
  );
};

export default FileSearch;
