import React from "react";

const StorageOverview: React.FC = () => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition duration-300">
      <h1 className="text-3xl font-bold">Storage Services Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
        {["Cloud Storage", "Local Storage", "Organized Files"].map((title, index) => (
          <div
            key={index}
            className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md dark:bg-gray-800 transition duration-300"
          >
            <h2 className="text-xl font-semibold">{title}</h2>
            <button className="mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition duration-300">
              Connect
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-6">User Tips & Best Practices</h2>
      <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
        <li>Organize files in folders</li>
        <li>Backup important files</li>
        <li>Use cloud storage for accessibility</li>
      </ul>
    </div>
  );
};

export default StorageOverview;