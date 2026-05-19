export default function QuickNavigationList({
  documents = [],
  currentIndex = 0,
  onSelect,
}) {
  return (
    <div
      style={{
        background: "#201d1a",
        border: "1px solid #2e2e2e",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "4px",
        }}
      >
        {/* Hamburger icon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "16px",
                height: "2px",
                background: "#e07b39",
                borderRadius: "1px",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "14px",
            fontWeight: "700",
            color: "#f0ece6",
          }}
        >
          Quick Navigation
        </span>
      </div>

      {/* Document List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {documents.map((doc, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={doc.name || index}
              onClick={() => onSelect && onSelect(index)}
              style={{
                background: isActive ? "#252220" : "transparent",
                border: `1px solid ${isActive ? "#333028" : "#2a2724"}`,
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#252220";
                  e.currentTarget.style.borderColor = "#333028";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#2a2724";
                }
              }}
            >
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "12px",
                  color: isActive ? "#f0ece6" : "#8a8278",
                  fontWeight: isActive ? "600" : "400",
                }}
              >
                {doc.name}
              </span>

              {/* Status indicator */}
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: doc.approved
                    ? "#e07b39"
                    : isActive
                    ? "#333028"
                    : "#2a2724",
                  border: `1px solid ${doc.approved ? "#e07b39" : "#8a8278"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {doc.approved && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="#f0ece6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}