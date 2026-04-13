/**
 * constants.js — shared constants for ZenXplor Local Indexer extension
 */

export const TEXT_EXTENSIONS = new Set([
  "txt", "md", "rst", "csv", "log", "py", "js", "ts", "jsx", "tsx",
  "html", "htm", "css", "json", "xml", "yaml", "yml", "toml", "ini",
  "cfg", "sh", "bat", "c", "cpp", "h", "java", "rb", "go", "rs",
]);

export const EXCLUDE_DIRS = new Set([
  "node_modules", ".git", ".venv", ".gradle", "AppData", ".cache",
  ".config", ".idea", ".vscode", "Library", "__pycache__",
]);

export const CHUNK_SIZE = 20;   // files per multipart request
export const DB_NAME = "zenxplor-ext";
export const STORE_HANDLES = "folder-handles";
