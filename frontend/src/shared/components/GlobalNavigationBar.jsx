import { useState } from "react";

const steps = ["Data Import", "AI Assessment", "Generate Introduction"];

export default function GlobalNavigationBar({ currentStep = 1, onNavigate }) {
  return (
    <nav
      style={{
        background: "#1a1a1a",
        borderBottom: "1px solid #2e2e2e",
        padding: "0 32px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: "'Georgia', serif",
          fontWeight: "700",
          fontSize: "20px",
          color: "#ffffff",
          letterSpacing: "-0.3px",
          cursor: "pointer",
        }}
      >
        CiteWise
      </div>

      {/* Step Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;
          return (
            <button
              key={step}
              onClick={() => onNavigate && onNavigate(index)}
              style={{
                background: "none",
                border: "none",
                cursor: isPast || isActive ? "pointer" : "default",
                fontFamily: "'Georgia', serif",
                fontSize: "14px",
                fontWeight: isActive ? "700" : "400",
                color: isActive
                  ? "#ffffff"
                  : isPast
                  ? "#888888"
                  : "#555555",
                letterSpacing: "0.2px",
                padding: "4px 0",
                position: "relative",
                transition: "color 0.2s ease",
              }}
            >
              {step}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-22px",
                    left: "0",
                    right: "0",
                    height: "2px",
                    background: "#e8620a",
                    borderRadius: "1px",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}