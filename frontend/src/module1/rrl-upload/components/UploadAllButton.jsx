export default function UploadAllButton({ onClick, isUploading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isUploading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        background: "#e07b39",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "0.9rem",
        fontWeight: 700,
        padding: "0.75rem 1rem",
        cursor: (disabled || isUploading) ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        width: "100%",
        opacity: (disabled || isUploading) ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isUploading) e.currentTarget.style.background = "#c96d2e";
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isUploading) e.currentTarget.style.background = "#e07b39";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
      {isUploading ? "Uploading..." : "Upload All"}
    </button>
  );
}