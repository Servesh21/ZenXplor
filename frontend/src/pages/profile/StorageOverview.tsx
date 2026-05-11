import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../api";
import DashboardLayout from "../../components/DashboardLayout";
import SyncProgressBar from "../../components/SyncProgressBar";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID;

interface Account {
  id: number;
  provider: string;
  email: string;
  permissions: string[];
  lastSynced: string | null;
}

interface IndexingProgress {
  status: string;
  processed: number;
  total: number | null;
}

interface UserProgress {
  [source: string]: {
    [accountId: string]: IndexingProgress;
  };
}


const CloudStorageAccounts = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<Account[]>([]);
  // const [syncingAccount, setSyncingAccount] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const userResponse = await axios.get(`${BACKEND_URL}/auth/profile`, { withCredentials: true });
      const id = userResponse.data.id;
      if (!id) {
        setIsLoading(false);
        return [];
      }

      const accountsResponse = await axios.get(`${BACKEND_URL}/cloud-accounts/${id}`, {
        withCredentials: true,
      });
      if (Array.isArray(accountsResponse.data)) {
        setConnectedAccounts(accountsResponse.data);
        return accountsResponse.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Poll for progress
  useEffect(() => {
    const pollProgress = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/search/indexing-progress`, { withCredentials: true });
        setProgress(res.data || {});
      } catch (error) {
        console.error("Failed to fetch indexing progress", error);
      }
    };

    pollProgress();
    const intervalId = setInterval(pollProgress, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSyncDropbox = async (accountId: number) => {
    try {
      await axios.post(`${BACKEND_URL}/search/sync-dropbox`, { account_id: accountId }, { withCredentials: true });
      fetchAccounts();
    } catch (error) {
      console.error("Error syncing Dropbox account:", error);
    }
  };

  const handleSyncGoogleAccount = async (accountId: number) => {
    try {
      await axios.post(`${BACKEND_URL}/search/sync-cloud-storage`, { account_id: accountId }, { withCredentials: true });
      await axios.post(`${BACKEND_URL}/search/gmail/sync`, { account_id: accountId }, { withCredentials: true });
      await axios.post(`${BACKEND_URL}/search/photos/sync`, { account_id: accountId }, { withCredentials: true });
      fetchAccounts();
    } catch (error) {
      console.error("Error syncing Google account:", error);
    }
  };

  // Listen for OAuth popup completion
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "oauth_complete" && event.data?.status === "success") {
        showToast(`Connected ${event.data.email || "account"} successfully! Syncing...`);
        await fetchAccounts();
        
        // Wait briefly for accounts to be updated in state
        setTimeout(() => {
           // We could trigger sync here, but the backend redirect is easier to track via URL params
        }, 500);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchAccounts]);

  // Also check URL params for callback redirect (fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      const email = params.get("email");
      showToast(`Connected ${email || "account"} successfully! Initiating sync...`);
      
      const initiateSync = async () => {
         const accounts = await fetchAccounts();
         
         // Trigger sync for the newly added account
         try {
             if (Array.isArray(accounts)) {
                 const newAcc = accounts.find(a => a.email === email);
                 if (newAcc) {
                     if (newAcc.provider === 'Dropbox') {
                         handleSyncDropbox(newAcc.id);
                     } else if (newAcc.provider === 'Google Drive') {
                         handleSyncGoogleAccount(newAcc.id);
                     }
                 }
             }
         } catch (e) {
             console.error("Could not auto-start sync:", e);
         }
      };
      
      initiateSync();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchAccounts]);

  const handleAddGoogleDrive = async () => {
    try {
      // Get signed state token from backend (carries user_id securely)
      const stateRes = await axios.get(`${BACKEND_URL}/cloud-storage/oauth-state`, { withCredentials: true });
      const state = stateRes.data.state;

      const REDIRECT_URI = `${BACKEND_URL}/cloud-storage/callback`;
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(
          "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/photoslibrary.readonly"
        )}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(state)}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get OAuth state:", error);
      showToast("Authentication error. Please try again.");
    }
  };

  const handleAddDropbox = async () => {
    try {
      const stateRes = await axios.get(`${BACKEND_URL}/cloud-storage/oauth-state`, { withCredentials: true });
      const state = stateRes.data.state;

      const DROPBOX_REDIRECT_URI = `${BACKEND_URL}/cloud-storage/dropbox/callback`;
      const authUrl =
        `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${encodeURIComponent(DROPBOX_CLIENT_ID)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}` +
        `&state=${encodeURIComponent(state)}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get OAuth state:", error);
      showToast("Authentication error. Please try again.");
    }
  };

  const handleRemoveAccount = async (accountId: number) => {
    try {
      await axios.delete(`${BACKEND_URL}/cloud-accounts/${accountId}`, { withCredentials: true });
      setConnectedAccounts((prev) => prev.filter((account) => account.id !== accountId));
      showToast("Account removed.");
    } catch (error) {
      console.error("Failed to remove account:", error);
      showToast("Failed to remove account.");
    }
  };

  const googleAccounts = connectedAccounts.filter((acc) => acc.provider === "Google Drive");
  const dropboxAccounts = connectedAccounts.filter((acc) => acc.provider === "Dropbox");


  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[2px] text-primary font-bold">
              Workspace Configuration
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Integrations & Sources</h2>
            <p className="text-on-surface-variant text-sm max-w-lg">
              Manage your digital architecture. Connect cloud providers and local drives to
              centralize your workflow.
            </p>
          </div>

        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeleton Loading State
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container-low rounded-xl p-6 min-h-[220px] border border-outline-variant/10 animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-surface-container-high rounded-lg" />
                  <div className="w-20 h-5 bg-surface-container-high rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-2/3 bg-surface-container-high rounded" />
                  <div className="h-4 w-1/2 bg-surface-container-high rounded" />
                  <div className="h-10 w-full bg-surface-container-high rounded-lg" />
                </div>
              </div>
            ))
          ) : (
            <>
              {/* All Connected Google Drive Accounts */}
              {googleAccounts.map((account) => (
                <div
                  key={account.id}
                  className="group bg-surface-container-low hover:bg-surface-container transition-all duration-300 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-[80px]">cloud_queue</span>
                  </div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant/15">
                      <span className="material-symbols-outlined text-primary text-[28px]">cloud_queue</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      Connected
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-on-surface mb-1">Google Workspace</h3>
                    <div className="text-xs font-mono text-on-surface-variant mb-4">{account.email}</div>
                    <div className="flex flex-col gap-3">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 opacity-60">Google Drive</p>
                          <SyncProgressBar 
                            status={progress?.google_drive?.[String(account.id)]?.status}
                            processed={progress?.google_drive?.[String(account.id)]?.processed || 0}
                            total={progress?.google_drive?.[String(account.id)]?.total || null}
                          />
                        </div>
                        {progress?.google_photos?.[String(account.id)] && (
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 opacity-60">Google Photos</p>
                            <SyncProgressBar 
                              status={progress?.google_photos?.[String(account.id)]?.status}
                              processed={progress?.google_photos?.[String(account.id)]?.processed || 0}
                              total={progress?.google_photos?.[String(account.id)]?.total || null}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemoveAccount(account.id)}
                          className="py-1.5 px-3 rounded-lg border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Another Google Account Card — ALWAYS shown */}
              <div className="group bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-300 rounded-xl p-6 border border-outline-variant/10 flex flex-col justify-between min-h-[220px]">
                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[28px]">cloud_queue</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                    {googleAccounts.length > 0 ? "Add More" : "Inactive"}
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-on-surface mb-1">
                    {googleAccounts.length > 0 ? "Add Google Account" : "Google Workspace"}
                  </h3>
                  <div className="text-xs text-on-surface-variant mb-4">
                    {googleAccounts.length > 0
                      ? `${googleAccounts.length} account${googleAccounts.length > 1 ? "s" : ""} connected`
                      : "Index Drive, Gmail & Photos"}
                  </div>
                  <button
                    onClick={handleAddGoogleDrive}
                    className="w-full py-2 bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] rounded-lg text-[#1a1b23] text-xs font-bold hover:opacity-90 transition-all"
                  >
                    {googleAccounts.length > 0 ? "Connect Another" : "Connect Google"}
                  </button>
                </div>
              </div>

              {/* All Connected Dropbox Accounts */}
              {dropboxAccounts.map((account) => (
                <div
                  key={account.id}
                  className="group bg-surface-container-low hover:bg-surface-container transition-all duration-300 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-[80px]">cloud_upload</span>
                  </div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant/15">
                      <span className="material-symbols-outlined text-[#0061FF] text-[28px]">folder_shared</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      Connected
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-on-surface mb-1">Dropbox</h3>
                    <div className="text-xs font-mono text-on-surface-variant mb-4">
                      {account.email} · Last sync:{" "}
                      {account.lastSynced ? new Date(account.lastSynced).toLocaleTimeString() : "Never"}
                    </div>
                    <div className="flex flex-col gap-3">
                      <SyncProgressBar 
                        status={progress?.dropbox?.[String(account.id)]?.status}
                        processed={progress?.dropbox?.[String(account.id)]?.processed || 0}
                        total={progress?.dropbox?.[String(account.id)]?.total || null}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemoveAccount(account.id)}
                          className="py-1.5 px-3 rounded-lg border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Another Dropbox Account Card — ALWAYS shown */}
              <div className="group bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-300 rounded-xl p-6 border border-outline-variant/10 flex flex-col justify-between min-h-[220px]">
                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[28px]">cloud_upload</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                    {dropboxAccounts.length > 0 ? "Add More" : "Inactive"}
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-on-surface mb-1">
                    {dropboxAccounts.length > 0 ? "Add Dropbox Account" : "Dropbox"}
                  </h3>
                  <div className="text-xs text-on-surface-variant mb-4">
                    {dropboxAccounts.length > 0
                      ? `${dropboxAccounts.length} account${dropboxAccounts.length > 1 ? "s" : ""} connected`
                      : "Index professional cloud files"}
                  </div>
                  <button
                    onClick={handleAddDropbox}
                    className="w-full py-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-all"
                  >
                    {dropboxAccounts.length > 0 ? "Connect Another" : "Connect Dropbox"}
                  </button>
                </div>
              </div>

              {/* Local Computer */}
              <div className="group bg-surface-container-low hover:bg-surface-container lg:col-span-1 transition-all duration-300 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                  <span className="material-symbols-outlined text-[80px]">computer</span>
                </div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center border border-outline-variant/15 shrink-0">
                    <span className="material-symbols-outlined text-primary text-[28px]">desktop_windows</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                    Primary
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-on-surface mb-1">Local Architecture</h3>
                  <p className="text-[10px] font-mono text-on-surface-variant mb-4 opacity-70">
                    Agent Configured Desktop
                  </p>

                  <div className="flex flex-col gap-2">
                     <SyncProgressBar 
                       status={progress?.local?.default?.status}
                       processed={progress?.local?.default?.processed || 0}
                       total={progress?.local?.default?.total || null}
                     />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Audit Bottom Banner */}
        <div className="mt-12 bg-surface-container-low rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-outline-variant/10">
          <div className="flex -space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">lock</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">shield</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">key</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-on-surface font-semibold text-lg">Shared Security Model</h4>
            <p className="text-on-surface-variant text-sm mt-1">
              All connected sources use end-to-end encryption. Your data is indexed locally and never leaves your
              architected environment.
            </p>
          </div>
          <button className="px-6 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-semibold hover:bg-surface-container-high transition-all">
            View Security Audit
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div
            className="fixed bottom-4 right-4 bg-surface-container-high text-white border border-outline-variant/20 px-4 py-3 rounded-xl shadow-2xl z-[100] backdrop-blur-md"
            style={{ animation: "slideUp 0.25s ease-out" }}
          >
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary">check_circle</span>
              <p className="text-sm font-medium tracking-wide">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CloudStorageAccounts;