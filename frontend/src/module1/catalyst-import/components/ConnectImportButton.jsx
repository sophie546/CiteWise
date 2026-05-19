export default function ConnectImportButton({ onClick, isLoading }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "#e07b39",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "0.875rem",
        fontWeight: "600",
        padding: "0.5rem 1.125rem",
        cursor: isLoading ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.15s",
        opacity: isLoading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isLoading) e.currentTarget.style.background = "#c96d2e";
      }}
      onMouseLeave={(e) => {
        if (!isLoading) e.currentTarget.style.background = "#e07b39";
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px" }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {isLoading ? "Importing..." : "Connect & Import"}
    </button>
  );
}