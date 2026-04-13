# ZenXplor Chrome Extension — Local File Indexer

A lightweight Manifest V3 Chrome extension that indexes your local files into
ZenXplor **without requiring a desktop app install**.

---

## How it works

1. The user picks one or more local folders to watch.
2. The extension scans those folders using the browser's
   `FileSystemDirectoryHandle` API.
3. Files are uploaded in small chunks to the ZenXplor backend endpoint
   `POST /search/upload-and-index` using the user's JWT token.
4. The backend extracts text from TXT, PDF, DOCX, and PPTX files and stores
   the content in Elasticsearch for full-text search.
5. An hourly background alarm automatically re-syncs so the index stays fresh.
6. Folder handles are persisted in the extension's IndexedDB so they survive
   popup close and browser restart.

---

## Installation (developer mode)

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `chrome-extension/` directory.
4. The ZenXplor icon appears in your toolbar.

---

## First-time setup

1. Click the extension icon.
2. Enter your **Backend URL** (default `http://localhost:5000`).
3. Paste your **JWT access token** — obtainable from the ZenXplor web app:
   open DevTools → Application → Local Storage → `access_token`.
4. Click **Save Settings**.
5. Click **+ Add Folder** and select one or more directories.
6. Click **Sync Now** to index immediately; subsequent syncs happen
   automatically every hour.

---

## Directory structure

```
chrome-extension/
├── manifest.json      — Manifest V3 descriptor
├── popup.html         — Extension popup UI
├── popup.js           — Popup logic (folder management, sync UI)
├── background.js      — Service worker (hourly alarm, headless sync)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

> **Icons**: The `icons/` directory is not included in this repo. You can
> generate simple PNG icons (e.g. using a text "Z" on a blue background) or
> copy the ZenXplor logo at the required sizes (16×16, 48×48, 128×128 px).

---

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persist backend URL, JWT token, and last-sync timestamp |
| `alarms` | Schedule hourly background re-index |
| `host_permissions: http://localhost:5000/*` | POST files to the local ZenXplor backend |

No remote telemetry. All data stays between your browser, your local disk,
and your own ZenXplor backend.
