import { useState, useEffect } from "react";
import axios from "axios";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID;
const BACKEND_URL = "http://localhost:5000";

interface Account {
  id: number;
  provider: string;
  email: string;
  permissions: string[];
  lastSynced: string | null;
}

const CloudStorageAccounts = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<Account[]>([]);
  const [syncingAccount, setSyncingAccount] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserIdAndAccounts = async () => {
      try {
        const userResponse = await axios.get(`${BACKEND_URL}/auth/profile`, { withCredentials: true });
        const id = userResponse.data.id;

        if (!id) {
          console.error("User ID not found");
          return;
        }

        setUserId(id);

        const accountsResponse = await axios.get(`${BACKEND_URL}/cloud-accounts/${id}`, {
          withCredentials: true,
        });
        setConnectedAccounts(accountsResponse.data);
      } catch (error) {
        console.error("Error fetching user ID or accounts:", error);
      }
    };

    fetchUserIdAndAccounts();
  }, []);

  const handleAddGoogleDrive = () => {
    const REDIRECT_URI = "http://localhost:5000/cloud-storage/callback";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/photoslibrary.readonly")}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = authUrl;
  };

  const handleAddDropbox = () => {
    const DROPBOX_REDIRECT_URI = "http://localhost:5000/cloud-storage/dropbox/callback";
    const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
      `client_id=${encodeURIComponent(DROPBOX_CLIENT_ID)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}`;

    window.location.href = authUrl;
  };

  const handleSyncDropbox = async (accountId: number) => {
    setSyncingAccount(accountId);
    try {
      await axios.post(`${BACKEND_URL}/search/sync-dropbox`, { account_id: accountId }, { withCredentials: true });
      setConnectedAccounts((prev) =>
        prev.map((account) => account.id === accountId ? { ...account, lastSynced: new Date().toISOString() } : account)
      );
    } catch (error) {
      console.error("Error syncing Dropbox account:", error);
    } finally {
      setSyncingAccount(null);
    }
  };

  const handleSyncGoogleAccount = async (accountId: number) => {
    setSyncingAccount(accountId);
    try {
      await axios.post(`${BACKEND_URL}/search/sync-cloud-storage`, { account_id: accountId }, { withCredentials: true });
      await axios.post(`${BACKEND_URL}/search/gmail/sync`, { account_id: accountId }, { withCredentials: true });
      await axios.post(`${BACKEND_URL}/search/photos/sync`, { account_id: accountId }, { withCredentials: true });

      setConnectedAccounts((prev) =>
        prev.map((account) =>
          account.id === accountId ? { ...account, lastSynced: new Date().toISOString() } : account
        )
      );
    } catch (error) {
      console.error("Error syncing Google account:", error);
    } finally {
      setSyncingAccount(null);
    }
  };

  const handleRemoveAccount = async (accountId: number) => {
    try {
      await axios.delete(`${BACKEND_URL}/cloud-accounts/${accountId}`, { withCredentials: true });
      setConnectedAccounts((prev) => prev.filter((account) => account.id !== accountId));
    } catch (error) {
      console.error("Failed to remove account:", error);
    }
  };

  const getProviderIcon = (provider: string) => {
    console.log(provider)
    if (provider === "Google Drive") {
      return (
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
            <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
            <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
            <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
          </svg>
        </div>
      );
    } else if (provider === "Dropbox") {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6.3L7.5 9.3L12 12.3L7.5 15.3L3 12.3L7.5 9.3L3 6.3L7.5 3.3L12 6.3ZM7.5 15.3L12 18.3L16.5 15.3L12 12.3L16.5 9.3L21 12.3L16.5 15.3L21 18.3L16.5 21.3L12 18.3L7.5 21.3L3 18.3L7.5 15.3Z" fill="white"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-400 mb-4">Connected Cloud Storage</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your cloud storage accounts for unified file search across platforms
          </p>
        </header>

        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Connected Accounts</h2>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition duration-200 flex items-center gap-2 font-medium"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Account
            </button>
          </div>

          {connectedAccounts.length === 0 ? (
            <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-10 text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V7L14 1H6C5.46957 1 4.96086 1.21071 4.58579 1.58579C4.21071 1.96086 4 2.46957 4 3V19Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 1V7H20" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11V17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 14H15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No accounts connected yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Connect your cloud storage accounts to enable unified search</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition duration-200 font-medium"
              >
                Connect Your First Account
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center">
                      {getProviderIcon(account.provider)}
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {account.provider === "Google Drive" ? "Google Services" : account.provider}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{account.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-sm">
                          {account.lastSynced 
                            ? `Last synced: ${new Date(account.lastSynced).toLocaleString()}` 
                            : "Not yet synced"}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {account.provider === "Dropbox" ? (
                          <button
                            onClick={() => handleSyncDropbox(account.id)}
                            disabled={syncingAccount === account.id}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm disabled:bg-gray-400 transition duration-200 flex items-center gap-2"
                          >
                            {syncingAccount === account.id ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 12.25V13C4 17.1421 7.85786 20.5 12 20.5C16.1421 20.5 20 17.1421 20 13V12.25M12 4V14M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Sync Dropbox
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSyncGoogleAccount(account.id)}
                            disabled={syncingAccount === account.id}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:bg-gray-400 transition duration-200 flex items-center gap-2"
                          >
                            {syncingAccount === account.id ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 12.25V13C4 17.1421 7.85786 20.5 12 20.5C16.1421 20.5 20 17.1421 20 13V12.25M12 4V14M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Sync Google
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveAccount(account.id)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition duration-200 flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Connect Cloud Storage</h2>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">Choose a cloud storage provider to connect to your account.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleAddGoogleDrive} 
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                    <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
                    <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
                    <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
                  </svg>
                  <span className="font-medium">Connect Google Services</span>
                </button>
                <button 
                  onClick={handleAddDropbox} 
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition duration-200 flex items-center justify-center gap-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6.3L7.5 9.3L12 12.3L7.5 15.3L3 12.3L7.5 9.3L3 6.3L7.5 3.3L12 6.3ZM7.5 15.3L12 18.3L16.5 15.3L12 12.3L16.5 9.3L21 12.3L16.5 15.3L21 18.3L16.5 21.3L12 18.3L7.5 21.3L3 18.3L7.5 15.3Z" fill="#0061FF"/>
                  </svg>
                  <span className="font-medium">Connect Dropbox</span>
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  By connecting an account, you're allowing our service to access your files for search functionality.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudStorageAccounts;