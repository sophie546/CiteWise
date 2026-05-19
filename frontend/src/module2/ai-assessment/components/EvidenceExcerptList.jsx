import React from 'react';

// Map relevance level to the exact string expected by the design
const RELEVANCE_COLORS = {
  High: "#e8620a",
  Medium: "#c4933f",
  Low: "#888888",
};

const getRelevanceDisplay = (level) => {
  if (!level) return "Unknown";
  const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  return normalized === "High" || normalized === "Medium" || normalized === "Low"
    ? normalized
    : "Unknown";
};

const ExcerptItem = ({ index, quote, page, relevance }) => {
  const relevanceDisplay = getRelevanceDisplay(relevance);
  const color = RELEVANCE_COLORS[relevanceDisplay] || "#888888";

  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        padding: "18px 0",
        borderBottom: "1px solid #2a2a2a",
      }}
    >
      {/* Index number box */}
      <div
        style={{
          width: "32px",
          height: "32px",
          border: "1px solid #3a3a3a",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "12px",
            color: "#888888",
            fontWeight: "600",
          }}
        >
          {index}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "13px",
            color: "#cccccc",
            lineHeight: "1.65",
            margin: "0 0 8px 0",
            fontStyle: "italic",
          }}
        >
          "{quote}"
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "11px",
              color: "#555555",
            }}
          >
            Page {page}
          </span>
          <span style={{ color: "#444444", fontSize: "11px" }}>·</span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "11px",
              color: "#555555",
            }}
          >
            Relevance:{" "}
            <span
              style={{
                color: color,
                fontWeight: "600",
              }}
            >
              {relevanceDisplay}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

const EvidenceExcerptList = ({ excerpts }) => {
  // Same empty check as first file
  if (!excerpts || excerpts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Header always visible */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>📌</span>
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "16px",
              fontWeight: "700",
              color: "#e8620a",
            }}
          >
            Highlighted Evidence Excerpts
          </span>
        </div>
        {/* Scrollable container with empty message */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2e2e2e",
            borderRadius: "10px",
            padding: "0 20px",
            maxHeight: "320px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#3a3a3a #1a1a1a",
          }}
        >
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              fontFamily: "'Courier New', monospace",
              fontSize: "12px",
              color: "#555555",
            }}
          >
            No evidence excerpts available.
          </div>
        </div>
      </div>
    );
  }

  // Map from first file's shape to the display format
  const items = excerpts.map((excerpt, idx) => ({
    id: idx,
    quote: excerpt.quoteText || "",
    page: excerpt.pageNumber || "N/A",
    relevance: excerpt.relevanceLevel || "Unknown",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Section Header (same as file 2) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "16px" }}>📌</span>
        <span
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "16px",
            fontWeight: "700",
            color: "#e8620a",
          }}
        >
          Highlighted Evidence Excerpts
        </span>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2e2e2e",
          borderRadius: "10px",
          padding: "0 20px",
          maxHeight: "320px",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#3a3a3a #1a1a1a",
        }}
      >
        {items.map((item, i) => (
          <ExcerptItem
            key={i}
            index={i + 1}
            quote={item.quote}
            page={item.page}
            relevance={item.relevance}
          />
        ))}
      </div>
    </div>
  );
};

export default EvidenceExcerptList;