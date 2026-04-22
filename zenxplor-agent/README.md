# ZenXplor Local Agent

A silent Windows background service that indexes your entire filesystem and
exposes a localhost HTTP API that the ZenXplor React frontend queries directly.

No UI window. No browser extension required. Installs once via `.msi`.

---

## How it works

| Concern | Detail |
|---|---|
| **Install location** | `%LOCALAPPDATA%\ZenXplor\zenxplor-agent.exe` |
| **Data directory** | `%APPDATA%\ZenXplor\` |
| **Database** | `%APPDATA%\ZenXplor\index.db` (SQLite) |
| **Config** | `%APPDATA%\ZenXplor\config.ini` |
| **Log** | `%APPDATA%\ZenXplor\agent.log` |
| **HTTP port** | `127.0.0.1:7832` (localhost only) |
| **Windows startup** | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` |
| **Full re-scan** | Every 6 hours |
| **Real-time updates** | `watchdog` monitors every watched root |

On first launch the agent:

1. Enforces a single-instance lock on port 7832.
2. Creates `%APPDATA%\ZenXplor\` and initialises the SQLite database.
3. Runs a full recursive scan of `C:\Users` (configurable via `POST /roots`).
4. Starts `watchdog` observers on every root path.
5. Registers itself for Windows startup via the registry.
6. Starts the Flask API server (blocking).

---

## API reference

All endpoints except `/health` and `/auth` are restricted to `127.0.0.1`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/auth` | Save JWT token + backend URL |
| `GET` | `/search?q=…` | Search indexed files |
| `POST` | `/open` | Open file in Explorer |
| `GET` | `/download?filepath=…` | Download a file |
| `POST` | `/scan` | Trigger a full re-scan |
| `GET` | `/status` | Stats, scan state, roots |
| `POST` | `/roots` | Update watched roots |

### `GET /search`

Query params: `q` (required), `limit` (default 50), `offset` (default 0), `filetype` (optional).

```json
{
  "results": [
    {
      "filename": "report.pdf",
      "filepath": "C:\\Users\\Alice\\Documents\\report.pdf",
      "filetype": "pdf",
      "filesize": 204800,
      "last_modified": 1704067200.0,
      "is_folder": false,
      "source": "local"
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 50
}
```

### `POST /auth`

```json
{ "jwt_token": "eyJ…", "backend_url": "https://api.zenxplor.com" }
```

### `POST /roots`

```json
{ "roots": ["C:\\Users\\Alice", "D:\\"] }
```

---

## Build instructions

### Prerequisites

- Python 3.11+
- [WiX Toolset 3.x](https://wixtoolset.org/releases/)

### 1 — Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2 — Build the executable

```bash
cd build
pyinstaller zenxplor-agent.spec
# Output: build/dist/zenxplor-agent.exe
```

### 3 — Build the installer

```bash
cd build
candle zenxplor.wxs
light  zenxplor.wixobj -o zenxplor.msi
# Output: build/zenxplor.msi
```

### 4 — Install

Double-click `zenxplor.msi` — no admin rights required (per-user install).

---

## Configuration

Edit `%APPDATA%\ZenXplor\config.ini`:

```ini
[auth]
jwt_token = 
backend_url = 

[indexing]
roots = C:\Users
last_full_scan = 
registered = false
```

Or use `POST /roots` / `POST /auth` from the frontend — no manual editing needed.

---

## Excluded paths

The following directory names are never scanned or watched:

**Windows system:** `Windows`, `Windows.old`, `$Recycle.Bin`, `Program Files`,
`Program Files (x86)`, `ProgramData`, `System Volume Information`, `Recovery`, …

**Dev artifacts:** `node_modules`, `.git`, `__pycache__`, `.venv`, `dist`, `build`, …

**Excluded extensions:** `.tmp`, `.sys`, `.dll`, `.exe`, `.lnk`, `.ini`
