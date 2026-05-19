import React from 'react';

// Map relevance level to the exact string expected by the design
const RELEVANCE_COLORS = {
  High: "#e07b39",
  Medium: "#c4933f",
  Low: "#8a8278",
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
  const color = RELEVANCE_COLORS[relevanceDisplay] || "#8a8278";

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
            fontFamily: "'Geist Mono', monospace",
            fontSize: "12px",
            color: "#8a8278",
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
            fontFamily: "'Poppins', sans-serif",
            fontSize: "13px",
            color: "#f0ece6",
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
              fontFamily: "'Geist Mono', monospace",
              fontSize: "11px",
              color: "#8a8278",
            }}
          >
            Page {page}
          </span>
          <span style={{ color: "#8a8278", fontSize: "11px" }}>·</span>
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: "11px",
              color: "#8a8278",
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
              fontFamily: "'Poppins', sans-serif",
              fontSize: "16px",
              fontWeight: "700",
              color: "#e07b39",
            }}
          >
            Highlighted Evidence Excerpts
          </span>
        </div>
        {/* Scrollable container with empty message */}
        <div
          style={{
            background: "#1a1714",
            border: "1px solid #2e2e2e",
            borderRadius: "10px",
            padding: "0 20px",
            maxHeight: "320px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#333028 #1a1714",
          }}
        >
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              fontFamily: "'Geist Mono', monospace",
              fontSize: "12px",
              color: "#8a8278",
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
            fontFamily: "'Poppins', sans-serif",
            fontSize: "16px",
            fontWeight: "700",
            color: "#e07b39",
          }}
        >
          Highlighted Evidence Excerpts
        </span>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          background: "#1a1714",
          border: "1px solid #2e2e2e",
          borderRadius: "10px",
          padding: "0 20px",
          maxHeight: "320px",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#333028 #1a1714",
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