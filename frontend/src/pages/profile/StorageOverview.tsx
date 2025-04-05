import { useState, useEffect } from "react";
import axios from "axios";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DROPBOX_CLIENT_ID = "ya0ygxxz90ljt6f";
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
        userId
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
    console.log("Redirecting to:", authUrl);
  };

  const handleAddDropbox = () => {
    const DROPBOX_REDIRECT_URI = "http://localhost:5000/cloud-storage/dropbox/callback";

    const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
      `client_id=${encodeURIComponent(DROPBOX_CLIENT_ID)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}`;

    window.location.href = authUrl;
    console.log("Redirecting to:", authUrl);
  };

  const handleSyncDropbox = async (accountId: number) => {
    setSyncingAccount(accountId);
    console.log("Syncing Dropbox account:", accountId);

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
    console.log("Syncing Google account (Drive + Gmail + Photos):", accountId);

    try {
      // 1. Sync Google Drive
      await axios.post(`${BACKEND_URL}/search/sync-cloud-storage`, { account_id: accountId }, { withCredentials: true });

      // 2. Sync Gmail attachments
      await axios.post(`${BACKEND_URL}/search/gmail/sync`, {account_id: accountId}, { withCredentials: true });

      // 3. Sync Google Photos
      await axios.post(`${BACKEND_URL}/search/photos/sync`, {account_id: accountId}, { withCredentials: true });

      // Update last synced timestamp
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

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Connected Storage Accounts</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your cloud storage accounts for unified file search</p>
        </header>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Connected Accounts</h2>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">+ Add Account</button>
          </div>

          {connectedAccounts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No cloud storage accounts connected yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl">☁️</span>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{account.provider}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{account.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {account.lastSynced ? `Last synced: ${new Date(account.lastSynced).toLocaleString()}` : "Not yet synced"}
                      </p>
                      {account.provider === "Dropbox" ? (
                        <button
                          onClick={() => handleSyncDropbox(account.id)}
                          disabled={syncingAccount === account.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-500"
                        >
                          {syncingAccount === account.id ? "Syncing..." : "Sync Dropbox"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSyncGoogleAccount(account.id)}
                          disabled={syncingAccount === account.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-500"
                        >
                          {syncingAccount === account.id ? "Syncing..." : "Sync Google"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Storage Account</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">✖</button>
              </div>
              <button onClick={handleAddGoogleDrive} className="w-full mb-2 bg-blue-500 hover:bg-blue-700 text-white py-2 rounded-md">Connect Google Drive</button>
              <button onClick={handleAddDropbox} className="w-full bg-gray-600 hover:bg-gray-800 text-white py-2 rounded-md">Connect Dropbox</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudStorageAccounts;
