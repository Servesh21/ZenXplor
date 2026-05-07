import { useState } from "react";
import axios from "axios";
import { BACKEND_URL, AGENT_URL } from "../api";

export interface SearchResult {
  id: number;
  filename: string;
  filepath?: string;
  storage_type: string;
  cloud_file_id?: string;
  is_favorite: boolean;
  filetype?: string;
  filesize?: number;
  last_modified?: string;
  mime_type?: string;
}

export interface PreviewResponse {
  preview_type: "image" | "text" | "iframe" | "pdf" | "none";
  data?: string;        // base64 image data
  content?: string;     // text content
  viewer_url?: string;  // iframe/pdf viewer URL
  download_url?: string;// pdf download URL
  filename: string;
  filetype: string;
  filesize?: number;
  last_modified?: string;
  storage_type: string;
  message?: string;     // for gmail/fallback
}

const IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);
const TEXT_TYPES = new Set([
  "txt", "md", "csv", "json", "xml", "yaml", "yml",
  "py", "js", "ts", "jsx", "tsx", "html", "css",
  "sh", "bat", "log", "env", "toml", "ini", "cfg",
]);

/**
 * Build a local preview response by reading the file via the desktop agent.
 * Falls back to metadata-only if the agent is unreachable or the type isn't previewable.
 */
async function buildLocalPreview(file: SearchResult, agentRunning: boolean): Promise<PreviewResponse> {
  const ext = (file.filetype || file.filepath?.split(".").pop() || "").toLowerCase();
  const base: PreviewResponse = {
    preview_type: "none",
    filename: file.filename,
    filetype: ext,
    filesize: file.filesize,
    last_modified: file.last_modified,
    storage_type: file.storage_type,
  };

  if (!agentRunning || !file.filepath) {
    base.message = "Desktop agent is not running. Cannot preview local files.";
    return base;
  }

  // Image preview via agent /preview endpoint (serves raw file)
  if (IMAGE_TYPES.has(ext)) {
    try {
      const url = `${AGENT_URL}/preview?filepath=${encodeURIComponent(file.filepath)}`;
      // Verify the agent can serve this file
      const headRes = await axios.head(url, { timeout: 3000 });
      if (headRes.status === 200) {
        return {
          ...base,
          preview_type: "image",
          data: url, // Direct URL to agent-served image
        };
      }
    } catch {
      // Agent preview failed, fall through to none
    }
  }

  // Text preview: download first 5KB from agent and show inline
  if (TEXT_TYPES.has(ext)) {
    try {
      const url = `${AGENT_URL}/download?filepath=${encodeURIComponent(file.filepath)}`;
      const res = await axios.get(url, {
        timeout: 5000,
        responseType: "text",
        headers: { Range: "bytes=0-5000" },
      });
      if (res.data && typeof res.data === "string") {
        return {
          ...base,
          preview_type: "text",
          content: res.data.substring(0, 5000),
        };
      }
    } catch {
      // Fall through to try backend
    }
  }

  // PDF preview: use agent as a direct stream in iframe
  if (ext === "pdf") {
    const url = `${AGENT_URL}/download?filepath=${encodeURIComponent(file.filepath)}`;
    return {
      ...base,
      preview_type: "pdf",
      viewer_url: url,
      download_url: url,
    };
  }

  // Fallback: try the backend preview endpoint (works when Flask is on same machine)
  try {
    const res = await axios.get(`${BACKEND_URL}/search/preview`, {
      params: { filepath: file.filepath },
      withCredentials: true,
      timeout: 5000,
    });
    if (res.data && res.data.preview_type && res.data.preview_type !== "none") {
      return res.data as PreviewResponse;
    }
  } catch {
    // Backend preview also failed
  }

  return base;
}

export function useFilePreview(agentRunning: boolean) {
  const [selectedFile, setSelectedFile] = useState<SearchResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectFile(file: SearchResult) {
    setSelectedFile(file);
    setLoading(true);
    setError(null);
    try {
      let data: PreviewResponse;

      if (file.storage_type === "local" || file.storage_type === "local_browser") {
        // Local files: preview via agent first, backend as fallback
        data = await buildLocalPreview(file, agentRunning);
      } else {
        // Cloud files: always use backend preview endpoint
        const res = await axios.get(`${BACKEND_URL}/search/preview`, {
          params: { filepath: file.filepath },
          withCredentials: true,
        });
        data = res.data;
      }

      setPreviewData(data);
    } catch (e: any) {
      setError(e.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  function closePanel() {
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
  }

  return { selectedFile, previewData, loading, error, selectFile, closePanel };
}
