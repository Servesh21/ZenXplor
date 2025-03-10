import React, { useState } from "react";

const CloudStorageAccounts = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Sample connected accounts data
  const connectedAccounts = [
    {
      id: 1,
      service: "Google Drive",
      icon: "🔵",
      email: "johndoe@gmail.com",
      permissions: ["Read files", "Search files", "Access metadata"],
      lastSynced: "10 minutes ago",
      fileCount: 1432
    },
    {
      id: 2,
      service: "Dropbox",
      icon: "🔷",
      email: "john.doe@example.com",
      permissions: ["Read files", "Search files", "Access metadata"],
      lastSynced: "1 hour ago",
      fileCount: 857
    },
    {
      id: 3,
      service: "OneDrive",
      icon: "🔵",
      email: "john.doe@outlook.com",
      permissions: ["Read files", "Search files"],
      lastSynced: "3 hours ago",
      fileCount: 623
    }
  ];
  
  // Available services to connect (removed iCloud and Amazon S3)
  const availableServices = [
    { name: "Google Drive", icon: "🔵" },
    { name: "Dropbox", icon: "🔷" },
    { name: "OneDrive", icon: "🔵" },
    
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Connected Storage Accounts</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your cloud storage accounts for unified file search
          </p>
        </header>
        
        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Connected Accounts</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{connectedAccounts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files Indexed</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {connectedAccounts.reduce((sum, account) => sum + account.fileCount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Search Index Update</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">10 minutes ago</p>
          </div>
        </div>
        
        {/* Connected Accounts */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Connected Accounts</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Account
            </button>
          </div>
          
          {connectedAccounts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No cloud storage accounts connected yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedAccounts.map(account => (
                <div key={account.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 mr-4">
                          <span className="text-xl">{account.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{account.service}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                          {account.fileCount.toLocaleString()} files indexed
                        </span>
                        <div className="relative group">
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {account.permissions.map((permission, i) => (
                              <span key={i} className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last synced: {account.lastSynced}</p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            Sync now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Add Account Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Storage Account</h2>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Select a cloud storage provider to connect to your account
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {availableServices.map((service, index) => (
                    <button
                      key={index}
                      className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <span className="text-4xl mb-3">{service.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{service.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mr-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    You'll be redirected to the selected service to authorize access for file searching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Permissions Information */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 mb-8">
          <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3">
            About File Search Permissions
          </h2>
          <p className="text-blue-700 dark:text-blue-400 mb-4">
            Connecting your cloud storage accounts allows UniSearch to index your files for faster searching. Here's what permissions we request:
          </p>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span><strong>Read files:</strong> Access to read your files for indexing and search</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span><strong>Search files:</strong> Permission to search through your files</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span><strong>Access metadata:</strong> Read file names, dates, and sizes for better search results</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-blue-700 dark:text-blue-400">
            We <strong>do not</strong> request permission to modify, delete, or share your files.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudStorageAccounts;