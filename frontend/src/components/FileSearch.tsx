import React, { useState, useEffect } from "react";
import axios from "axios";

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

  useEffect(() => {
    let interval: number | null = null; // ✅ Use `number | null` instead of `NodeJS.Timeout`

    const getIndexingStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/search/index-status", { withCredentials: true });
        setIndexingStatus(response.data.status);

        if (response.data.status !== "in_progress" && interval !== null) {
          clearInterval(interval);
          interval = null;
        }
      } catch (error) {
        console.error("Failed to get indexing status:", error);
        if (interval !== null) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    if (indexingStatus === "in_progress") {
      interval = window.setInterval(getIndexingStatus, 3000); // ✅ Use `window.setInterval` for browser compatibility
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [indexingStatus]);

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
    try {
      await axios.post("http://localhost:5000/search/index-files", {}, { withCredentials: true });
      setIndexingStatus("in_progress"); // Start polling immediately
    } catch (error) {
      console.error("Reindexing failed:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg transition duration-300">
      <h2 className="text-2xl font-bold mb-4 text-center">File Search</h2>

      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <button onClick={handleReindex} className="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-800 w-full sm:w-auto transition">
          Reindex Files
        </button>
      </div>

      <p className={`text-sm font-semibold ${indexingStatus === "in_progress" ? "text-yellow-500" : indexingStatus === "completed" ? "text-green-500" : "text-gray-400"}`}>
        Indexing Status: {indexingStatus}
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search for files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
        />
        <button onClick={handleSearch} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
          Search
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-3">Search Results</h3>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : files.length > 0 ? (
        <ul className="space-y-3">
          {files.map((file) => (
            <li key={file.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center transition">
              <div className="mb-2 sm:mb-0">
                <p className="font-semibold">{file.filename}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Path: {file.filepath}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No files found.</p>
      )}
    </div>
  );
};

export default FileSearch;