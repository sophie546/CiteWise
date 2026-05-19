/**
 * DataDisplayGrid
 * Renders the three data columns: Research Title | Rationale | Research Gap
 * Each column has:
 *   - orange uppercase label at top
 *   - darker inner card containing the value (or placeholder)
 *
 * Props:
 *   catalystData  {object|null}   { title, rationale, gaps[] }
 *   isLoading     {boolean}
 *   error         {string}
 *   hasAttempted  {boolean}
 */
export default function DataDisplayGrid({ catalystData, isLoading, error, hasAttempted }) {
  if (error) {
    return (
      <div style={{
        margin: "1.25rem",
        background: "rgba(224, 85, 85, 0.1)",
        border: "1px solid rgba(224, 85, 85, 0.28)",
        borderRadius: "8px",
        color: "#e05555",
        fontSize: "0.875rem",
        padding: "0.75rem 1rem",
        textAlign: "center",
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      padding: "1.25rem 1.5rem",
    }}>
      <DataColumn
        label="Research Title"
        value={catalystData?.title}
        isLoading={isLoading}
        hasAttempted={hasAttempted}
      />
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
  );
}

// ── Inner column ─────────────────────────────────────────────────
function DataColumn({ label, value, isLoading, hasAttempted, isList }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.625rem",
    }}>
      {/* Orange uppercase label */}
      <p style={{
        fontSize: "0.7rem",
        fontWeight: "700",
        letterSpacing: "0.1em",
        color: "#e07b39",
        textTransform: "uppercase",
        margin: 0,
      }}>
        {label}
      </p>

      {/* Darker inner value card */}
      <div style={{
        background: "#252220",
        border: "1px solid #2e2b27",
        borderRadius: "10px",
        padding: "1rem",
        minHeight: "160px",
        flex: 1,
      }}>
        {isLoading ? (
          <p style={{ fontSize: "0.875rem", color: "#8a8278", fontStyle: "italic", margin: 0 }}>
            Loading...
          </p>
        ) : isList && Array.isArray(value) && value.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {value.map((gap, idx) => (
              <li key={idx} style={{ fontSize: "0.8rem", color: "#f0ece6", paddingLeft: "0.875rem", position: "relative", lineHeight: 1.5 }}>
                <span style={{ position: "absolute", left: 0, color: "#e07b39" }}>·</span>
                {gap}
              </li>
            ))}
          </ul>
        ) : value ? (
          <p style={{ fontSize: "0.875rem", color: "#f0ece6", lineHeight: 1.65, margin: 0 }}>
            {value}
          </p>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "#8a8278", fontStyle: "italic", margin: 0 }}>
            [Awaiting Import]
          </p>
        )}
      </div>
    </div>
  );
}