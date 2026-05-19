const METRICS = [
  { label: "Research Gap Alignment", key: "researchGapAlignment" },
  { label: "Methodological Relevance", key: "methodologicalRelevance" },
  { label: "Theoretical Contribution", key: "theoreticalContribution" },
  { label: "Citation Quality", key: "citationQuality" },
];

function ScoreBar({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 44px",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <span
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          color: "#aaaaaa",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Bar track */}
      <div
        style={{
          height: "8px",
          background: "#2a2a2a",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: "linear-gradient(90deg, #c4500a 0%, #e8620a 100%)",
            borderRadius: "4px",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      <span
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          color: "#e8620a",
          fontWeight: "700",
          textAlign: "right",
        }}
      >
        {value}%
      </span>
    </div>
  );
}

export default function SemanticScoreDashboard({ scores = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "16px" }}>📦</span>
        <span
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "16px",
            fontWeight: "700",
            color: "#e8620a",
          }}
        >
          Semantic Alignment Scores
        </span>
      </div>

      {/* Score Bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {METRICS.map(({ label, key }) => (
          <ScoreBar key={key} label={label} value={scores[key] ?? 0} />
        ))}
      </div>
    </div>
  );
}