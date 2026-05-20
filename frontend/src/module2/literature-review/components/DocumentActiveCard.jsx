import { useState } from "react";

function ApprovalToggle({ isApproved, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(0, 0, 0, 0.15)",
        border: "1px solid #3A3630",
        borderRadius: "12px",
        padding: "16px 20px",
      }}
    >
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "14px",
          fontWeight: "700",
          color: "#D98A21",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        Approval Status
      </span>

      {/* Toggle Switch */}
      <div
        onClick={onToggle}
        style={{
          width: "54px",
          height: "28px",
          borderRadius: "14px",
          background: "#12100e",
          border: "1px solid #3A3630",
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: isApproved ? "#D85A30" : "#3A3630",
            position: "absolute",
            top: "3px",
            left: isApproved ? "29px" : "3px",
            transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s",
            boxShadow: isApproved ? "0 0 8px rgba(216, 90, 48, 0.4)" : "none",
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
        background: "#1E1C19",
        border: "1px solid #3A3630",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* Header: doc count + pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "15px",
            fontWeight: "700",
            color: "#D98A21",
          }}
        >
          Document {currentIndex + 1} of {documents.length || 3}
        </span>

        <div style={{ display: "flex", gap: "14px" }}>
          {["‹", "›"].map((arrow, i) => (
            <button
              key={arrow}
              onClick={() => onNavigate && onNavigate(i === 0 ? currentIndex - 1 : currentIndex + 1)}
              style={{
                background: "none",
                border: "none",
                color: "#D85A30",
                cursor: "pointer",
                fontSize: "24px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                padding: "0 4px",
                transition: "transform 0.15s, opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>

      {/* Separator line stretching fully to borders */}
      <div
        style={{
          height: "1px",
          background: "#3A3630",
          margin: "0 -20px 20px -20px",
        }}
      />

      {/* Document Info - Flat layout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "20px",
          padding: "0 4px",
        }}
      >
        {/* PDF folding dog-ear icon */}
        <div
          style={{
            position: "relative",
            width: "36px",
            height: "46px",
            background: "#D85A30",
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: "6px",
            flexShrink: 0,
          }}
        >
          {/* Dog-ear triangle overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "0 10px 10px 0",
              borderColor: "transparent transparent #1E1C19 #1E1C19",
              borderTopRightRadius: "4px",
            }}
          />
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "9px",
              fontWeight: "900",
              color: "#f0ece6",
              letterSpacing: "0.2px",
            }}
          >
            PDF
          </span>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "15px",
              fontWeight: "600",
              color: "#f0ece6",
              marginBottom: "3px",
            }}
          >
            {doc.name}
          </div>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "12px",
              color: "#8a8278",
            }}
          >
            {doc.size} - {doc.pages} pages
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