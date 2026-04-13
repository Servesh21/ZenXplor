/**
 * constants.js — shared constants for ZenXplor Local Indexer extension
 */

export const TEXT_EXTENSIONS = new Set([
  "txt", "md", "rst", "csv", "log", "py", "js", "ts", "jsx", "tsx",
  "html", "htm", "css", "json", "xml", "yaml", "yml", "toml", "ini",
  "cfg", "sh", "bat", "c", "cpp", "h", "java", "rb", "go", "rs",
]);

export const EXCLUDE_DIRS = new Set([
  // Dev / tooling
  "node_modules", ".git", ".venv", ".gradle", ".idea", ".vscode", "__pycache__",
  // User-level caches / config
  "AppData", ".cache", ".config", ".local", ".npm", ".yarn",
  // macOS system
  "Library", "System", "private", "cores",
  // Windows system
  "Windows", "Program Files", "Program Files (x86)", "ProgramData",
  "$Recycle.Bin", "$RECYCLE.BIN", "System Volume Information",
  "Recovery", "PerfLogs", "MSOCache",
  // Linux / Unix system
  "proc", "sys", "dev", "run", "snap", "boot", "lost+found",
]);

export const CHUNK_SIZE = 20;   // files per multipart request
export const DB_NAME = "zenxplor-ext";
export const STORE_HANDLES = "folder-handles";
