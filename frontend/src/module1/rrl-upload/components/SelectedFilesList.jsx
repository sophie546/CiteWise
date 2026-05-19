function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusConfig = {
  queued:    { label: "Ready",     tone: "neutral", color: "#8a8278", bg: "rgba(255,255,255,0.08)" },
  uploading: { label: "Uploading", tone: "neutral", color: "#8a8278", bg: "rgba(255,255,255,0.08)" },
  uploaded:  { label: "Uploaded",  tone: "success", color: "#4caf82", bg: "rgba(76,175,130,0.15)" },
  failed:    { label: "Failed",    tone: "error",   color: "#e05555", bg: "rgba(224,85,85,0.15)" },
  invalid:   { label: "Rejected",  tone: "error",   color: "#e05555", bg: "rgba(224,85,85,0.15)" },
  duplicate: { label: "Duplicate", tone: "warn",    color: "#e0a835", bg: "rgba(224,168,53,0.15)" },
};

export default function SelectedFilesList({ files, onRemove }) {
  if (!files.length) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center", color: "#8a8278", fontSize: "0.8rem", fontStyle: "italic" }}>
        [No Files Selected]
      </div>
    );
  }
  return (
    <ul style={{
      flex: 1,
      overflowY: "auto",
      listStyle: "none",
      padding: "0.5rem",
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
    }}>
      {files.map((item) => {
        const cfg = statusConfig[item.status] || statusConfig.queued;
        return (
          <li key={item.id} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#2a2724",
            borderRadius: "6px",
            padding: "0.4rem 0.625rem",
            gap: "0.5rem",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.8rem", color: "#f0ece6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px", margin: 0 }}>
                {item.name}
              </p>
              <p style={{ fontSize: "0.7rem", color: "#8a8278", margin: 0 }}>
                {formatFileSize(item.size)} · {item.message}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px",
                background: cfg.bg,
                color: cfg.color,
              }}>{cfg.label}</span>
              {item.status !== "uploading" && (
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8a8278",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    padding: "0.1rem 0.3rem",
                    borderRadius: "4px",
                    transition: "color 0.15s",
                  }}
                  onClick={() => onRemove(item.id)}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#e05555"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#8a8278"}
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}