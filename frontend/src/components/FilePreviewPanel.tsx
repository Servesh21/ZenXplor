import React, { useEffect } from "react";
import { SearchResult, PreviewResponse } from "../hooks/useFilePreview";

interface FilePreviewPanelProps {
  file: SearchResult | null;
  previewData: PreviewResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onFavoriteToggle: (filepath: string) => void;
  onOpen: (file: SearchResult) => void;
  onDownload: (file: SearchResult) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr || dateStr === "None") return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }) + ", " + d.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function formatStorageType(st: string): string {
  switch (st) {
    case "local": return "Local Storage";
    case "local_browser": return "Browser Upload";
    case "local_upload": return "Uploaded";
    case "google_drive": return "Google Drive";
    case "dropbox": return "Dropbox";
    case "gmail": return "Gmail";
    case "google_photos": return "Google Photos";
    default: return st.replace(/_/g, " ");
  }
}

function getSourceBadgeColor(st: string) {
  switch (st) {
    case "google_drive": return { bg: "rgba(66,133,244,0.12)", border: "rgba(66,133,244,0.3)", text: "#4285F4" };
    case "dropbox": return { bg: "rgba(0,97,255,0.12)", border: "rgba(0,97,255,0.3)", text: "#0061FF" };
    case "gmail": return { bg: "rgba(234,67,53,0.12)", border: "rgba(234,67,53,0.3)", text: "#EA4335" };
    case "google_photos": return { bg: "rgba(251,188,4,0.12)", border: "rgba(251,188,4,0.3)", text: "#FBBC04" };
    default: return { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", text: "#34D399" };
  }
}

const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
  file, previewData, loading, error, onClose, onFavoriteToggle, onOpen, onDownload
}) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isOpen = file !== null;
  const badge = file ? getSourceBadgeColor(file.storage_type) : getSourceBadgeColor("local");

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 49, display: "none",
          }}
          className="preview-backdrop"
        />
      )}

      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "360px", maxWidth: "100vw",
          background: "#0D0E14",
          borderLeft: "1px solid #1E2030",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 250ms ease",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        className="preview-panel"
      >
        {file && (
          <>
            {/* Header (sticky) */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid #1E2030",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                  <h3 style={{
                    fontSize: 16, fontWeight: 600, color: "#EAEAF0",
                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {file.filename}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text,
                    }}>
                      {formatStorageType(file.storage_type)}
                    </span>
                    <span style={{ fontSize: 12, color: "#4A4C5E" }}>
                      {formatDate(previewData?.last_modified || file.last_modified)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#4A4C5E", padding: 4, lineHeight: 1,
                    transition: "color 200ms ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#6C63FF")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4A4C5E")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>
              {/* Loading */}
              {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                  <div style={{
                    width: 32, height: 32, border: "2px solid #1E2030",
                    borderTop: "2px solid #6C63FF", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div style={{
                  padding: 16, borderRadius: 8, background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444",
                  fontSize: 13, textAlign: "center",
                }}>
                  {error}
                </div>
              )}

              {/* Preview area */}
              {!loading && !error && previewData && (
                <div style={{ marginBottom: 20 }}>
                  {previewData.preview_type === "image" && previewData.data && (
                    <img
                      src={previewData.data}
                      alt={previewData.filename}
                      style={{
                        width: "100%", borderRadius: 8,
                        border: "1px solid #1E2030",
                      }}
                    />
                  )}

                  {previewData.preview_type === "text" && previewData.content && (
                    <div>
                      <pre style={{
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: 12, lineHeight: 1.6,
                        background: "#13141C", color: "#EAEAF0",
                        padding: 12, borderRadius: 8,
                        border: "1px solid #1E2030",
                        overflowX: "auto", maxHeight: 400, overflowY: "auto",
                        margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
                      }}>
                        {previewData.content}
                      </pre>
                      <p style={{ fontSize: 12, color: "#4A4C5E", marginTop: 8 }}>
                        Showing first {previewData.content.split("\n").length} lines
                      </p>
                    </div>
                  )}

                  {previewData.preview_type === "iframe" && previewData.viewer_url && (
                    <iframe
                      src={previewData.viewer_url}
                      title="File preview"
                      width="100%"
                      height="400"
                      style={{ border: "none", borderRadius: 8 }}
                      sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                  )}

                  {previewData.preview_type === "pdf" && (
                    <div>
                      <iframe
                        src={previewData.viewer_url}
                        title="PDF preview"
                        width="100%"
                        height="460"
                        style={{ border: "none", borderRadius: 8, display: "block" }}
                      />
                      {previewData.download_url && (
                        <button
                          onClick={() => onDownload(file)}
                          style={{
                            marginTop: 12, width: "100%", padding: "10px 0",
                            background: "#13141C", border: "1px solid #22243A",
                            borderRadius: 8, color: "#EAEAF0",
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "all 200ms ease",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6C63FF"; e.currentTarget.style.color = "#6C63FF"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#22243A"; e.currentTarget.style.color = "#EAEAF0"; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                          Download PDF
                        </button>
                      )}
                    </div>
                  )}

                  {previewData.preview_type === "none" && (
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      padding: "40px 0", gap: 8,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#22243A" }}>
                        description
                      </span>
                      <p style={{ fontSize: 14, color: "#8B8D9E", margin: 0 }}>
                        Preview not available
                      </p>
                      <p style={{ fontSize: 12, color: "#4A4C5E", margin: 0 }}>
                        {previewData.message || `for .${previewData.filetype} files`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {!loading && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  rowGap: 12, columnGap: 8, marginBottom: 20,
                  padding: "16px 0", borderTop: "1px solid #1E2030",
                }}>
                  {[
                    { label: "File name", value: file.filename },
                    { label: "Type", value: (previewData?.filetype || file.filetype || "—").toUpperCase() },
                    { label: "Size", value: formatBytes(previewData?.filesize || file.filesize) },
                    { label: "Source", value: formatStorageType(file.storage_type) },
                    { label: "Modified", value: formatDate(previewData?.last_modified || file.last_modified) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{
                        fontSize: 12, fontWeight: 500, color: "#4A4C5E",
                        margin: "0 0 2px", textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}>{label}</p>
                      <p style={{
                        fontSize: 13, color: "#EAEAF0", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: label === "File name" ? "nowrap" : undefined,
                        wordBreak: label === "File name" ? undefined : "break-all",
                      }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons (sticky bottom) */}
            <div style={{
              padding: "16px 20px", borderTop: "1px solid #1E2030",
              flexShrink: 0, display: "flex", gap: 8,
            }}>
              <button
                onClick={() => onOpen(file)}
                style={{
                  flex: 1, padding: "10px 0",
                  background: "linear-gradient(135deg, #c4c0ff, #8781ff)",
                  border: "none", borderRadius: 8,
                  color: "#1b0091", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                Open
              </button>
              <button
                onClick={() => onDownload(file)}
                style={{
                  flex: 1, padding: "10px 0",
                  background: "#13141C", border: "1px solid #22243A",
                  borderRadius: 8, color: "#EAEAF0",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6C63FF"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#22243A"; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                Download
              </button>
              <button
                onClick={() => onFavoriteToggle(file.filepath || "")}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  border: `1px solid ${file.is_favorite ? "rgba(250,204,21,0.3)" : "#22243A"}`,
                  borderRadius: 8,
                  color: file.is_favorite ? "#FACC15" : "#4A4C5E",
                  fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#FACC15"; e.currentTarget.style.color = "#FACC15"; }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = file.is_favorite ? "rgba(250,204,21,0.3)" : "#22243A";
                  e.currentTarget.style.color = file.is_favorite ? "#FACC15" : "#4A4C5E";
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={file.is_favorite ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  star
                </span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* CSS for mobile + spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 767px) {
          .preview-panel {
            width: 100vw !important;
          }
          .preview-backdrop {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
};

export default FilePreviewPanel;
