/**
 * popup.js — ZenXplor Local Indexer extension popup
 *
 * Flow:
 *  1. User enters their ZenXplor backend URL + JWT access token once.
 *  2. User adds one or more local folders to watch (via showDirectoryPicker).
 *  3. "Sync Now" (or the hourly alarm) scans every watched folder and uploads
 *     files to the backend in small chunks.
 *
 * Files are sent to POST /search/upload-and-index (multipart) so the server
 * can extract text content for PDF / DOCX / PPTX / plain-text files.
 *
 * Folder *handles* are kept in the extension's own IndexedDB so they survive
 * popup close / browser restart (Chrome persists FileSystemDirectoryHandle
 * objects stored in IndexedDB for extensions).
 */

import { TEXT_EXTENSIONS, EXCLUDE_DIRS, CHUNK_SIZE, DB_NAME, STORE_HANDLES } from "./constants.js";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

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

async function saveHandle(name, handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HANDLES, "readwrite");
    tx.objectStore(STORE_HANDLES).put({ name, handle });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function removeHandle(name) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HANDLES, "readwrite");
    tx.objectStore(STORE_HANDLES).delete(name);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Scan a directory handle recursively ─────────────────────────────────────

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

// ─── Upload to ZenXplor backend ───────────────────────────────────────────────

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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

async function syncAll(onProgress) {
  const { backendUrl, jwtToken } = await chrome.storage.local.get(["backendUrl", "jwtToken"]);
  if (!backendUrl || !jwtToken) {
    onProgress({ status: "error", message: "Backend URL or JWT token not configured." });
    return;
  }

  const savedHandles = await getSavedHandles();
  if (!savedHandles.length) {
    onProgress({ status: "error", message: "No folders to sync. Add a folder first." });
    return;
  }

  const allFiles = [];

  onProgress({ status: "scanning", message: "Scanning folders…", percent: 0 });
  for (const { name, handle } of savedHandles) {
    const perm = await handle.queryPermission({ mode: "read" });
    if (perm !== "granted") {
      const req = await handle.requestPermission({ mode: "read" });
      if (req !== "granted") {
        onProgress({ status: "warning", message: `Permission denied for "${name}". Skipping.` });
        continue;
      }
    }
    for await (const entry of walkDirectory(handle, name)) {
      allFiles.push(entry);
    }
  }

  const total = allFiles.length;
  if (total === 0) {
    onProgress({ status: "done", message: "No files found in watched folders.", percent: 100 });
    return;
  }

  onProgress({ status: "uploading", message: `Found ${total} files. Uploading…`, percent: 0 });

  let indexed = 0;
  for (let i = 0; i < allFiles.length; i += CHUNK_SIZE) {
    const chunk = allFiles.slice(i, i + CHUNK_SIZE);
    try {
      await uploadChunk(chunk, backendUrl, jwtToken);
    } catch (err) {
      console.warn("ZenXplor extension: chunk upload failed", err);
    }
    indexed += chunk.length;
    const percent = Math.round((indexed / total) * 100);
    onProgress({ status: "uploading", message: `Indexed ${indexed}/${total} files…`, percent });
  }

  const now = new Date().toLocaleString();
  await chrome.storage.local.set({ lastSync: now });
  onProgress({ status: "done", message: `Done — ${indexed} files indexed at ${now}`, percent: 100 });
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

function setStatus(msg) {
  $("status-text").textContent = msg;
}

function setProgress(percent) {
  $("progress-bar").style.width = `${percent}%`;
}

function showProgress() {
  $("progress-section").style.display = "block";
}

async function renderFolderList() {
  const saved = await getSavedHandles();
  const ul = $("folder-list");
  ul.innerHTML = "";
  if (!saved.length) {
    ul.innerHTML = '<li style="color:#94a3b8;border:none;background:none;font-size:12px;">No folders added yet</li>';
    return;
  }
  for (const { name } of saved) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = name;
    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.title = "Remove folder";
    btn.addEventListener("click", async () => {
      await removeHandle(name);
      renderFolderList();
    });
    li.appendChild(span);
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get(["backendUrl", "jwtToken", "lastSync"]);
  if (stored.backendUrl) $("backend-url").value = stored.backendUrl;
  if (stored.jwtToken)  $("jwt-token").value   = stored.jwtToken;
  if (stored.lastSync)  $("last-sync").textContent = `Last synced: ${stored.lastSync}`;

  await renderFolderList();

  $("save-settings-btn").addEventListener("click", async () => {
    const backendUrl = $("backend-url").value.trim().replace(/\/$/, "");
    const jwtToken   = $("jwt-token").value.trim();
    if (!backendUrl) { $("settings-status").textContent = "Backend URL required."; return; }
    if (!jwtToken)   { $("settings-status").textContent = "JWT token required."; return; }
    await chrome.storage.local.set({ backendUrl, jwtToken });
    $("settings-status").textContent = "✓ Saved — starting sync…";

    // Kick off an immediate sync so the user doesn't have to wait an hour
    const savedHandles = await getSavedHandles();
    if (savedHandles.length) {
      $("sync-now-btn").disabled = true;
      showProgress();
      await syncAll(({ message, percent }) => {
        setStatus(message);
        if (percent !== undefined) setProgress(percent);
      });
      $("sync-now-btn").disabled = false;
      const updated = await chrome.storage.local.get("lastSync");
      if (updated.lastSync) $("last-sync").textContent = `Last synced: ${updated.lastSync}`;
    }
    setTimeout(() => { $("settings-status").textContent = ""; }, 3000);
  });

  $("add-folder-btn").addEventListener("click", async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      await saveHandle(handle.name, handle);
      await renderFolderList();

      // Immediately index the newly added folder so the user sees results right away
      const { backendUrl, jwtToken } = await chrome.storage.local.get(["backendUrl", "jwtToken"]);
      if (backendUrl && jwtToken) {
        $("sync-now-btn").disabled = true;
        showProgress();
        await syncAll(({ message, percent }) => {
          setStatus(message);
          if (percent !== undefined) setProgress(percent);
        });
        $("sync-now-btn").disabled = false;
        const updated = await chrome.storage.local.get("lastSync");
        if (updated.lastSync) $("last-sync").textContent = `Last synced: ${updated.lastSync}`;
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
  });

  $("sync-now-btn").addEventListener("click", async () => {
    $("sync-now-btn").disabled = true;
    showProgress();
    await syncAll(({ message, percent }) => {
      setStatus(message);
      if (percent !== undefined) setProgress(percent);
    });
    $("sync-now-btn").disabled = false;
    const stored2 = await chrome.storage.local.get("lastSync");
    if (stored2.lastSync) $("last-sync").textContent = `Last synced: ${stored2.lastSync}`;
  });
});
