/**
 * background.js — ZenXplor Local Indexer service worker
 *
 * Sets up a periodic alarm that triggers an automatic re-sync of all
 * watched folders every hour so the index stays fresh without any manual
 * user action.
 *
 * The actual sync logic lives in popup.js; here we only handle the alarm
 * and message the popup (or re-run the sync inline if the popup is closed).
 */

const ALARM_NAME = "zenxplor-auto-sync";
const ALARM_PERIOD_MINUTES = 60;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "rst", "csv", "log", "py", "js", "ts", "jsx", "tsx",
  "html", "htm", "css", "json", "xml", "yaml", "yml", "toml", "ini",
  "cfg", "sh", "bat", "c", "cpp", "h", "java", "rb", "go", "rs",
]);

const EXCLUDE_DIRS = new Set([
  "node_modules", ".git", ".venv", ".gradle", "AppData", ".cache",
  ".config", ".idea", ".vscode", "Library", "__pycache__",
]);

// ─── IndexedDB helpers (duplicated from popup.js for service-worker context) ─

const DB_NAME = "zenxplor-ext";
const STORE_HANDLES = "folder-handles";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_HANDLES, { keyPath: "name" });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function getSavedHandles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HANDLES, "readonly");
    const req = tx.objectStore(STORE_HANDLES).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Directory walker ─────────────────────────────────────────────────────────

async function* walkDirectory(dirHandle, relativePath) {
  for await (const [name, handle] of dirHandle.entries()) {
    const nextPath = `${relativePath}/${name}`;
    if (handle.kind === "directory") {
      if (EXCLUDE_DIRS.has(name)) continue;
      yield* walkDirectory(handle, nextPath);
    } else {
      yield { fileHandle: handle, relativePath: nextPath, name };
    }
  }
}

// ─── Upload helper ────────────────────────────────────────────────────────────

const CHUNK_SIZE = 20;

async function uploadChunk(files, backendUrl, token) {
  const formData = new FormData();
  for (const { fileHandle, relativePath, name } of files) {
    const file = await fileHandle.getFile();
    formData.append("files", file, name);
    formData.append(`paths[${name}]`, relativePath);
  }
  const res = await fetch(`${backendUrl}/search/upload-and-index`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─── Background sync ─────────────────────────────────────────────────────────

async function runBackgroundSync() {
  const { backendUrl, jwtToken } = await chrome.storage.local.get(["backendUrl", "jwtToken"]);
  if (!backendUrl || !jwtToken) return;

  const savedHandles = await getSavedHandles();
  if (!savedHandles.length) return;

  const allFiles = [];
  for (const { name, handle } of savedHandles) {
    const perm = await handle.queryPermission({ mode: "read" });
    if (perm !== "granted") continue; // skip folders that need user interaction to re-grant
    for await (const entry of walkDirectory(handle, name)) {
      allFiles.push(entry);
    }
  }

  for (let i = 0; i < allFiles.length; i += CHUNK_SIZE) {
    await uploadChunk(allFiles.slice(i, i + CHUNK_SIZE), backendUrl, jwtToken).catch((err) =>
      console.warn("ZenXplor bg sync chunk failed:", err)
    );
  }

  const now = new Date().toLocaleString();
  await chrome.storage.local.set({ lastSync: now });
  console.log(`ZenXplor: background sync complete at ${now} (${allFiles.length} files)`);
}

// ─── Service worker lifecycle ─────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: ALARM_PERIOD_MINUTES,
    periodInMinutes: ALARM_PERIOD_MINUTES,
  });
  console.log("ZenXplor Local Indexer installed. Auto-sync alarm set.");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    runBackgroundSync().catch((err) => console.error("ZenXplor bg sync error:", err));
  }
});
