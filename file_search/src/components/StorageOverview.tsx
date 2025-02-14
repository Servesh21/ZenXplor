import React from "react";

const StorageOverview: React.FC = () => {
  return (
    <div className="p-6 text-black">
      <h1 className="text-3xl font-bold">Storage Services Overview</h1>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Cloud Storage</h2>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Connect
          </button>
        </div>
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Local Storage</h2>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Connect
          </button>
        </div>
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Organized Files</h2>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Connect
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-6">User Tips & Best Practices</h2>
      <ul className="list-disc pl-5 mt-2">
        <li>Organize files in folders</li>
        <li>Backup important files</li>
        <li>Use cloud storage for accessibility</li>
      </ul>
    </div>
  );
};

export default StorageOverview;
