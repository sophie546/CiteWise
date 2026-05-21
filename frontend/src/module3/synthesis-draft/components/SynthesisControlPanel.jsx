export default function SynthesisControlPanel({ 
  generationStatus, 
  generationProgress, 
  statusText, 
  onSynthesize, 
  onRegenerate,
  hasApprovedDocuments,
  approvedCount
}) {
  return (
    <div
      style={{
        background: "#1E1C19",
        border: "1px solid #3A3630",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.15)",
          borderBottom: "1px solid #3A3630",
          padding: "16px 20px",
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "#D98A21",
            letterSpacing: "0.01em",
          }}
        >
          Synthesis Control
        </span>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Generation Status Box */}
        <div
          style={{
            background: "#33302b",
            border: "1px solid #3A3630",
            borderRadius: "10px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8a8278",
            }}
          >
            Generation Status
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              color: "#f0ece6",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {generationStatus === "generating" && (
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#e07b39",
                  display: "inline-block",
                  animation: "pulse 1.2s infinite",
                }}
              />
            )}
            {statusText}
          </span>

          {generationStatus === "generating" && (
            <div
              style={{
                width: "100%",
                height: "4px",
                background: "#1a1714",
                borderRadius: "2px",
                marginTop: "8px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${generationProgress}%`,
                  height: "100%",
                  background: "#e07b39",
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                  position: "relative",
                }}
              />
            </div>
          )}
        </div>

        {/* Draft Introduction Button */}
        {generationStatus !== "complete" ? (
          <button
            onClick={onSynthesize}
            disabled={generationStatus === "generating" || !hasApprovedDocuments}
            style={{
              background: (generationStatus === "generating" || !hasApprovedDocuments) ? "rgba(0, 0, 0, 0.15)" : "#D85A30",
              color: (generationStatus === "generating" || !hasApprovedDocuments) ? "#8a8278" : "#f0ece6",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              cursor: (generationStatus === "generating" || !hasApprovedDocuments) ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.875rem",
              fontWeight: "700",
              transition: "background 0.2s ease, transform 0.1s ease",
              textAlign: "center",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (generationStatus !== "generating" && hasApprovedDocuments) e.currentTarget.style.background = "#e96439";
            }}
            onMouseLeave={(e) => {
              if (generationStatus !== "generating" && hasApprovedDocuments) e.currentTarget.style.background = "#D85A30";
            }}
          >
            {!hasApprovedDocuments 
              ? `No Approved Documents (${approvedCount})` 
              : generationStatus === "generating" 
                ? `Drafting (${generationProgress}%)` 
                : "Draft Introduction"}
          </button>
        ) : (
          <button
            onClick={onRegenerate}
            style={{
              background: "#D85A30",
              color: "#f0ece6",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.875rem",
              fontWeight: "700",
              transition: "background 0.2s ease, transform 0.1s ease",
              textAlign: "center",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e96439";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#D85A30";
            }}
          >
            Clear & Regenerate
          </button>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}