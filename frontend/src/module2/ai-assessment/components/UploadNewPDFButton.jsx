export default function UploadNewPDFButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#e07b39",
        border: "none",
        borderRadius: "10px",
        padding: "12px 22px",
        cursor: "pointer",
        transition: "background 0.2s ease, transform 0.1s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#c96d2e";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#e07b39";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Upload icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="2"
          y="2"
          width="14"
          height="14"
          rx="2"
          stroke="#f0ece6"
          strokeWidth="1.5"
        />
        <path
          d="M9 12V6M9 6L6.5 8.5M9 6L11.5 8.5"
          stroke="#f0ece6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "14px",
          fontWeight: "700",
          color: "#f0ece6",
          whiteSpace: "nowrap",
          letterSpacing: "0.2px",
        }}
      >
        Upload New PDF
      </span>
    </button>
  );
}