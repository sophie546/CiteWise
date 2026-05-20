export default function QuickNavigationList({
  documents = [],
  currentIndex = 0,
  onSelect,
  onDelete,
}) {
  return (
    <div
      style={{
        background: "#1E1C19",
        border: "1px solid #3A3630",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
        /* Grow naturally with content, but never exceed the column height */
        maxHeight: '100%',
        minHeight: 0,
        overflowY: 'auto',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
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
                background: "#D98A21",
                borderRadius: "1px",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "15px",
            fontWeight: "700",
            color: "#D98A21",
          }}
        >
          Quick Navigation
        </span>
      </div>

      {/* Document List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {documents.map((doc, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={doc.id || doc.name || index}
              onClick={() => onSelect && onSelect(index)}
              style={{
                background: "rgba(0, 0, 0, 0.15)",
                border: `1px solid ${isActive ? "#D98A21" : "#3A3630"}`,
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "#D98A21";
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "#3A3630";
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.15)";
                }
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "13px",
                    color: isActive ? "#f0ece6" : "#8a8278",
                    fontWeight: isActive ? "600" : "500",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.name}
                </span>
              </div>

              {/* Action buttons (Delete) if needed, styled minimally */}
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${doc.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(index);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8a8278",
                    fontSize: "14px",
                    lineHeight: 1,
                    cursor: "pointer",
                    padding: "4px 6px",
                    borderRadius: "4px",
                    flexShrink: 0,
                    transition: "color 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#e05555";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8a8278";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  ✕
                </button>
              )}

              {/* Status indicator circle */}
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: doc.approved ? "#D85A30" : "transparent",
                  border: `1px solid ${doc.approved ? "#D85A30" : "#3A3630"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {doc.approved && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="#f0ece6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
