import { useState } from "react";

function ApprovalToggle({ isApproved, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1e1e1e",
        border: "1px solid #2e2e2e",
        borderRadius: "8px",
        padding: "14px 18px",
      }}
    >
      <span
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "11px",
          fontWeight: "700",
          color: "#888888",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
        }}
      >
        Approval Status
      </span>

      {/* Toggle Switch */}
      <div
        onClick={onToggle}
        style={{
          width: "52px",
          height: "28px",
          borderRadius: "14px",
          background: isApproved ? "#e8620a" : "#3a3a3a",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.25s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#ffffff",
            position: "absolute",
            top: "3px",
            left: isApproved ? "27px" : "3px",
            transition: "left 0.25s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </div>
  );
}

export default function DocumentActiveCard({
  documents = [],
  currentIndex = 0,
  onNavigate,
  onApprovalToggle,
}) {
  const doc = documents[currentIndex] || {
    name: "Document_001.pdf",
    size: "2.4 MB",
    pages: 15,
    approved: false,
  };

  return (
    <div
      style={{
        background: "#1e1e1e",
        border: "1px solid #2e2e2e",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header: doc count + pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "12px",
            fontWeight: "700",
            color: "#e8620a",
            letterSpacing: "0.5px",
          }}
        >
          Document {currentIndex + 1} of {documents.length || 3}
        </span>

        <div style={{ display: "flex", gap: "4px" }}>
          {["‹", "›"].map((arrow, i) => (
            <button
              key={arrow}
              onClick={() => onNavigate && onNavigate(i === 0 ? currentIndex - 1 : currentIndex + 1)}
              style={{
                background: "none",
                border: "1px solid #3a3a3a",
                borderRadius: "6px",
                color: "#aaaaaa",
                width: "28px",
                height: "28px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#e8620a";
                e.currentTarget.style.color = "#e8620a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#3a3a3a";
                e.currentTarget.style.color = "#aaaaaa";
              }}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>

      {/* Document Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "#252525",
          borderRadius: "8px",
          padding: "14px",
        }}
      >
        {/* PDF Icon */}
        <div
          style={{
            width: "40px",
            height: "48px",
            background: "#e8620a",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "9px",
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            PDF
          </span>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: "4px",
            }}
          >
            {doc.name}
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "11px",
              color: "#666666",
            }}
          >
            {doc.size} · {doc.pages} pages
          </div>
        </div>
      </div>

      {/* Approval Toggle */}
      <ApprovalToggle
        isApproved={doc.approved}
        onToggle={() => onApprovalToggle && onApprovalToggle(currentIndex)}
      />
    </div>
  );
}