const STEPS = ["Data Import", "AI Assessment", "Generate Introduction"];

export default function GlobalNavigationBar({ currentStep = 0, onNavigate }) {
  return (
    <nav
      style={{
        background: "#1a1714",
        borderBottom: "1px solid #2e2a26",
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 2rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#f0ece6",
            letterSpacing: "-0.01em",
            userSelect: "none",
          }}
        >
          CiteWise
        </span>

        {/* Step tabs */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: "60px" }}>
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            // Allow navigating to any step via the navbar (enable forward navigation)
            const isClickable = true;
            return (
              <button
                key={step}
                onClick={() => isClickable && onNavigate?.(index)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #e07b39" : "2px solid transparent",
                  cursor: isClickable ? "pointer" : "default",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? "#f0ece6"
                    : isPast
                    ? "#8a8278"
                    : "rgba(240,236,230,0.32)",
                  padding: "0 20px",
                  transition: "color 0.2s, border-color 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {step}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}