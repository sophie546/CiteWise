import React from 'react';

// Metrics definition using first file's keys, but labels from second file
const METRICS = [
  { label: "Research Gap Alignment", key: "gapAlignment" },
  { label: "Methodological Relevance", key: "methodology" },
  { label: "Theoretical Contribution", key: "theoretical" },
  { label: "Citation Quality", key: "citation" },
];

const FLAG_LABELS = {
  TOPIC_MISMATCH: "Topic mismatch",
  NO_METHOD_JUSTIFICATION: "No method justification",
  NO_EVALUATION_METRICS: "No evaluation metrics",
  NO_THEORY_OR_FRAMEWORK: "No theory or framework",
  FRAMEWORK_NAMED_NOT_USED: "Framework named but not meaningfully used",
  REFERENCES_MISSING_OR_UNCLEAR: "References missing or unclear",
  CATALYST_GAP_COVERAGE_TOO_LOW: "CATalyst gap coverage too low",
  SOURCE_COVERAGE_BELOW_80_PERCENT: "Source coverage below 80%",
};

const SPECIAL_TERM_LABELS = {
  ai: "AI",
  apa: "APA",
  doi: "DOI",
  pdf: "PDF",
  rag: "RAG",
  catalyst: "CATalyst",
  api: "API",
};

const formatFlagLabel = (flag) => {
  if (flag === undefined || flag === null) return "";

  const rawValue = String(flag).trim();
  if (!rawValue) return "";

  if (FLAG_LABELS[rawValue]) {
    return FLAG_LABELS[rawValue];
  }

  if (!/^[A-Z0-9_]+$/.test(rawValue)) {
    return rawValue.replace(/\s+/g, " ");
  }

  const readable = rawValue
    .replace(/_/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (/^\d+%$/.test(word)) return word;

      const specialLabel = SPECIAL_TERM_LABELS[word];
      if (specialLabel) return specialLabel;

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  return readable.charAt(0).toUpperCase() + readable.slice(1);
};

const FLAG_GROUP_STYLES = {
  mismatch: {
    labelColor: "#ff6b6b",
    borderColor: "rgba(255,107,107,0.18)",
    chipBackground: "#221212",
    chipColor: "#ffb3b3",
  },
  weakness: {
    labelColor: "#ffb86b",
    borderColor: "rgba(255,184,107,0.14)",
    chipBackground: "#241a0e",
    chipColor: "#ffd39b",
  },
  validation: {
    labelColor: "#8acbff",
    borderColor: "rgba(138,203,255,0.14)",
    chipBackground: "#0e2330",
    chipColor: "#c7e6ff",
  },
};

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
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          color: "#8a8278",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Bar track */}
      <div
        style={{
          height: "8px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "linear-gradient(90deg, #D98A21 0%, #D85A30 100%)",
            borderRadius: "4px",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      <span
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: "12px",
          color: "#D98A21",
          fontWeight: "700",
          textAlign: "right",
        }}
      >
        {percent}%
      </span>
    </div>
  );
};

const SemanticScoreDashboard = ({ scores = {}, recommendationStatus, confidenceLevel, relevanceLevel, mismatchFlags = [], weaknessFlags = [], validationFlags = [] }) => {
  const renderFlagGroup = (title, flags, variant) => {
    if (!flags || flags.length === 0) return null;

    const styles = FLAG_GROUP_STYLES[variant];

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: "1 1 240px",
          minWidth: "0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Geist Mono', monospace",
            fontSize: "11px",
            color: styles.labelColor,
            letterSpacing: "0.02em",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: styles.labelColor,
              boxShadow: `0 0 0 3px ${styles.borderColor}`,
              flexShrink: 0,
            }}
          />
          {title}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "flex-start",
            minWidth: "0",
          }}
        >
          {flags.map((flag, idx) => {
            const label = formatFlagLabel(flag);
            const isValidation = variant === "validation";

            return (
              <span
                key={`${title}-${idx}-${String(flag)}`}
                title={String(flag)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  maxWidth: isValidation ? "100%" : "280px",
                  minWidth: 0,
                  padding: isValidation ? "5px 10px" : "4px 10px",
                  borderRadius: "999px",
                  fontFamily: "'Geist', sans-serif",
                  fontSize: "12px",
                  lineHeight: 1.3,
                  color: styles.chipColor,
                  background: styles.chipBackground,
                  border: `1px solid ${styles.borderColor}`,
                  whiteSpace: isValidation ? "nowrap" : "normal",
                  overflow: "hidden",
                  textOverflow: isValidation ? "ellipsis" : "clip",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Section Header (using second file's icon and style) */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D98A21" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="#D98A21" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "16px",
            fontWeight: "700",
            color: "#D98A21",
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

      {/* Overall + recommendation area */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
          marginTop: "6px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '36px', fontWeight: 800, color: '#D98A21', lineHeight: 1 }}>
            {scores.overall !== null && scores.overall !== undefined ? `${Math.round(scores.overall)}%` : '--'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', color: '#8a8278' }}>Overall Score</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 700, color: '#f0ece6', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recommendationStatus || 'No recommendation'}</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#8a8278' }}>Confidence: <strong style={{ color: '#D98A21', marginLeft: 6 }}>{confidenceLevel || 'Unknown'}</strong></span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#8a8278' }}>Relevance: <strong style={{ color: '#D98A21', marginLeft: 6 }}>{relevanceLevel || 'Unknown'}</strong></span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            flex: '1 1 360px',
            minWidth: 0,
            width: '100%',
          }}
        >
          {renderFlagGroup('Mismatch', mismatchFlags, 'mismatch')}
          {renderFlagGroup('Weakness', weaknessFlags, 'weakness')}
          {renderFlagGroup('Validation', validationFlags, 'validation')}
        </div>
      </div>
    </div>
  );
};

export default SemanticScoreDashboard;