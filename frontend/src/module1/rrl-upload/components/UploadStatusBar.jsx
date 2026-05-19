export default function UploadStatusBar({ readyCount, totalCount, statusMessage, uploadState }) {
  const statusColor = {
    ready: "#4caf82",
    success: "#4caf82",
    uploading: "#e07b39",
    error: "#e05555",
    warning: "#e0a835",
  }[uploadState] || "#8a8278";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#252220",
      border: "1px solid #333028",
      borderRadius: "8px",
      padding: "0.6rem 0.875rem",
      fontSize: "0.8rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#8a8278" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>Files: {totalCount ?? readyCount}</span>
      </div>
      <div style={{ fontWeight: 600, color: statusColor }}>
        {uploadState === "ready" ? "✓ Ready" : statusMessage}
      </div>
    </div>
  );
}