import React from 'react';

// Metrics definition using first file's keys, but labels from second file
const METRICS = [
  { label: "Research Gap Alignment", key: "gapAlignment" },
  { label: "Methodological Relevance", key: "methodology" },
  { label: "Theoretical Contribution", key: "theoretical" },
  { label: "Citation Quality", key: "citation" },
];

// Helper to normalise values: 0.75 → 75, 85 → 85
const getPercentage = (value) => {
  if (value === undefined || value === null) return 0;
  if (value <= 1 && value > 0) return Math.round(value * 100);
  return Math.round(value);
};

const ScoreBar = ({ label, value }) => {
  const percent = getPercentage(value);
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
            width: `${percent}%`,
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
        {percent}%
      </span>
    </div>
  );
};

const SemanticScoreDashboard = ({ scores = {} }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Section Header (using second file's icon and style) */}
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
          <ScoreBar key={key} label={label} value={scores[key]} />
        ))}
      </div>
    </div>
  );
};

export default SemanticScoreDashboard;