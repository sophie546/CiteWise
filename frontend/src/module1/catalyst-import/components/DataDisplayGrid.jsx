/**
 * DataDisplayGrid
 * Renders the three data columns: Research Title | Rationale | Research Gap
 * Each column has:
 *   - orange uppercase label at top
 *   - darker inner card containing the value (or placeholder)
 */
export default function DataDisplayGrid({ catalystData, isLoading, error, hasAttempted }) {
  if (error) {
    return (
      <div
        style={{
          margin: "1.25rem",
          background: "rgba(216, 90, 48, 0.08)",
          border: "1px solid rgba(216, 90, 48, 0.25)",
          borderRadius: "8px",
          color: "#D85A30",
          fontSize: "0.875rem",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          padding: "0.75rem 1rem",
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.25rem 1.5rem",
      }}
    >
      {/* Research Title at the top spanning full width */}
      <DataColumn
        label="Research Title"
        value={catalystData?.title}
        isLoading={isLoading}
        hasAttempted={hasAttempted}
        isTitleRow
      />

      {/* Rationale and Research Gap in a 2-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.25rem",
        }}
      >
        <DataColumn
          label="Rationale"
          value={catalystData?.rationale}
          isLoading={isLoading}
          hasAttempted={hasAttempted}
        />
        <DataColumn
          label="Research Gap"
          value={catalystData?.gaps}
          isLoading={isLoading}
          hasAttempted={hasAttempted}
          isList
        />
      </div>
    </div>
  );
}

// ── Inner column ─────────────────────────────────────────────────
function DataColumn({ label, value, isLoading, hasAttempted, isList, isTitleRow }) {
  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.15)",
        border: "1px solid #3A3630",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minHeight: isTitleRow ? "120px" : "240px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#D98A21";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(217, 138, 33, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#3A3630";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Golden uppercase label */}
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          letterSpacing: "0.08em",
          color: "#D98A21",
          textTransform: "uppercase",
          fontFamily: "'Poppins', sans-serif",
          margin: 0,
        }}
      >
        {label}
      </p>

      {/* Light black inner value container */}
      <div
        style={{
          background: "none",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflowY: "auto",
        }}
      >
        {isLoading ? (
          <p
            style={{
              fontSize: isTitleRow ? "1.05rem" : "0.85rem",
              color: "rgba(240, 236, 230, 0.4)",
              fontStyle: "italic",
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Loading...
          </p>
        ) : isList && Array.isArray(value) && value.length ? (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            {value.map((gap, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: "0.85rem",
                  color: "#f0ece6",
                  paddingLeft: "1rem",
                  position: "relative",
                  lineHeight: 1.5,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span style={{ position: "absolute", left: 0, color: "#D98A21", fontWeight: "bold" }}>•</span>
                {gap}
              </li>
            ))}
          </ul>
        ) : value ? (
          <p
            style={{
              fontSize: isTitleRow ? "1.15rem" : "0.85rem",
              fontWeight: isTitleRow ? "600" : "400",
              color: "#f0ece6",
              lineHeight: isTitleRow ? 1.45 : 1.65,
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {value}
          </p>
        ) : (
          <p
            style={{
              fontSize: isTitleRow ? "1.05rem" : "0.85rem",
              color: "rgba(240, 236, 230, 0.4)",
              fontStyle: "italic",
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            [Awaiting Import]
          </p>
        )}
      </div>
    </div>
  );
}