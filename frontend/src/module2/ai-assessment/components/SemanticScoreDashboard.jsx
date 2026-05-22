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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '36px', fontWeight: 800, color: '#D98A21' }}>
            {scores.overall !== null && scores.overall !== undefined ? `${Math.round(scores.overall)}%` : '--'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', color: '#8a8278' }}>Overall Score</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 700, color: '#f0ece6' }}>{recommendationStatus || 'No recommendation'}</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#8a8278' }}>Confidence: <strong style={{ color: '#D98A21', marginLeft: 6 }}>{confidenceLevel || 'Unknown'}</strong></span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#8a8278' }}>Relevance: <strong style={{ color: '#D98A21', marginLeft: 6 }}>{relevanceLevel || 'Unknown'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {mismatchFlags && mismatchFlags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '340px' }}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#ff6b6b' }}>Mismatch:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '96px', overflowY: 'auto', paddingRight: '6px' }}>
                {mismatchFlags.map((f, idx) => (
                  <span key={idx} style={{ background: '#221212', color: '#ff6b6b', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', whiteSpace: 'normal', lineHeight: 1.2, border: '1px solid rgba(255,107,107,0.18)' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {weaknessFlags && weaknessFlags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '340px' }}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#ffb86b' }}>Weakness:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '96px', overflowY: 'auto', paddingRight: '6px' }}>
                {weaknessFlags.map((f, idx) => (
                  <span key={idx} style={{ background: '#241a0e', color: '#ffb86b', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', whiteSpace: 'normal', lineHeight: 1.2, border: '1px solid rgba(255,184,107,0.12)' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {validationFlags && validationFlags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '340px' }}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#8acbff' }}>Validation:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '96px', overflowY: 'auto', paddingRight: '6px' }}>
                {validationFlags.map((f, idx) => (
                  <span key={idx} style={{ background: '#0e2330', color: '#8acbff', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', whiteSpace: 'normal', lineHeight: 1.2, border: '1px solid rgba(138,203,255,0.08)' }}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemanticScoreDashboard;