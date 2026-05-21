// module3/synthesis-draft/components/SynthesisControlCard.jsx
export default function SynthesisControlCard({
  generationStatus,
  generationProgress,
  statusText,
  onGenerate,
  onRegenerate,
}) {
  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>Synthesis Control</span>
      </div>

      {/* Body */}
      <div style={styles.cardBody}>
        {/* Generation Status Box */}
        <div style={styles.statusBox}>
          <span style={styles.statusLabel}>Generation Status</span>
          <span style={styles.statusText}>
            {generationStatus === "generating" && (
              <span style={styles.statusDot} />
            )}
            {statusText}
          </span>

          {/* Progress Bar */}
          {generationStatus === "generating" && (
            <div style={styles.progressBarContainer}>
              <div style={{ ...styles.progressBarFill, width: `${generationProgress}%` }} />
            </div>
          )}
        </div>

        {/* Action Button */}
        {generationStatus !== "complete" ? (
          <button
            onClick={onGenerate}
            disabled={generationStatus === "generating"}
            style={{
              ...styles.button,
              background: generationStatus === "generating" ? "rgba(0, 0, 0, 0.15)" : "#D85A30",
              color: generationStatus === "generating" ? "#8a8278" : "#f0ece6",
              cursor: generationStatus === "generating" ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (generationStatus !== "generating") e.currentTarget.style.background = "#e96439";
            }}
            onMouseLeave={(e) => {
              if (generationStatus !== "generating") e.currentTarget.style.background = "#D85A30";
            }}
            onMouseDown={(e) => {
              if (generationStatus !== "generating") e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              if (generationStatus !== "generating") e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {generationStatus === "generating" ? `Drafting (${generationProgress}%)` : "Draft Introduction"}
          </button>
        ) : (
          <button
            onClick={onRegenerate}
            style={styles.button}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e96439")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D85A30")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Clear & Regenerate
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#1E1C19",
    border: "1px solid #3A3630",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    background: "rgba(0, 0, 0, 0.15)",
    borderBottom: "1px solid #3A3630",
    padding: "16px 20px",
  },
  cardTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#D98A21",
    letterSpacing: "0.01em",
  },
  cardBody: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  statusBox: {
    background: "#33302b",
    border: "1px solid #3A3630",
    borderRadius: "10px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    position: "relative",
    overflow: "hidden",
  },
  statusLabel: {
    fontSize: "0.7rem",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8a8278",
  },
  statusText: {
    fontSize: "0.85rem",
    color: "#f0ece6",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#e07b39",
    display: "inline-block",
    animation: "pulse 1.2s infinite",
  },
  progressBarContainer: {
    width: "100%",
    height: "4px",
    background: "#1a1714",
    borderRadius: "2px",
    marginTop: "8px",
    position: "relative",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "#e07b39",
    borderRadius: "2px",
    transition: "width 0.4s ease",
    position: "relative",
  },
  button: {
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
  },
};