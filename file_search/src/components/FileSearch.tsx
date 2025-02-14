import React from "react";

interface FileItem {
  name: string;
  path: string;
}

const FileSearch: React.FC = () => {
  const files: FileItem[] = [
    { name: "Project.docx", path: "/documents/Project.docx" },
    { name: "Report.pdf", path: "/documents/Report.pdf" },
    { name: "Notes.txt", path: "/documents/Notes.txt" },
    { name: "Sales.xlsx", path: "/documents/Sales.xlsx" },
  ];

  const handleReindex = (): void => {
    alert("Reindexing process started...");
  };

  const handleIndexingHistory = (): void => {
    alert("Opening indexing history...");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-black">
      <h2 className="text-2xl font-bold mb-4 text-center">File Search</h2>

      {/* Buttons container */}
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <button
          onClick={handleReindex}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
        >
          Reindex Files
        </button>
        <button
          onClick={handleIndexingHistory}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto"
        >
          Indexing History
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search for files..."
        className="w-full p-2 border rounded mb-4"
      />

      <h3 className="text-xl font-semibold mb-3">Search Results</h3>

      <ul className="space-y-3">
        {files.map((file, index) => (
          <li
            key={index}
            className="p-3 bg-gray-100 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center"
          >
            <div className="mb-2 sm:mb-0">
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-gray-600">Path: {file.path}</p>
            </div>
            <a
              href={file.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Open File
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileSearch;

