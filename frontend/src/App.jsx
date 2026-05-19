import { useState } from "react";
import GlobalNavigationBar from "./shared/components/GlobalNavigationBar";
import WorkspaceImportLayout from "./module1/catalyst-import/components/WorkspaceImportLayout";
import ValidationDashboardLayout from "./module2/literature-review/components/ValidationDashboardLayout";
// import SynthesisDraftLayout from "./features/proposal-drafting/components/SynthesisDraftLayout";

/**
 * App.jsx – CiteWise root
 *
 * Step 0  →  Data Import        (WorkspaceImportLayout)
 * Step 1  →  AI Assessment      (ValidationDashboardLayout)
 * Step 2  →  Generate Introduction (placeholder until built)
 *
 */
export default function App() {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#1a1714" }}>

      {/* Shared top navigation – controls active step indicator */}
      <GlobalNavigationBar currentStep={step} onNavigate={setStep} />

      <main style={{
        flex: 1,
        padding: "2rem",
        maxWidth: 1280,
        width: "100%",
        margin: "0 auto",
      }}>

        {/* Module 1 – Data Import */}
        {step === 0 && (
          <WorkspaceImportLayout
            onImportSuccess={(sid) => setSessionId(sid)}
            onProceed={() => setStep(1)}
          />
        )}

        {/* Module 2 – AI Assessment */}
        {step === 1 && (
          <ValidationDashboardLayout
            sessionId={sessionId}
            onStepChange={setStep}
          />
        )}

        {/* Module 3 – Generate Introduction (placeholder) */}
        {step === 2 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            flexDirection: "column",
            gap: "0.75rem",
          }}>
            <p style={{
              color: "#e07b39",
              fontWeight: 700,
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: 0,
            }}>
              Generate Introduction
            </p>
            <p style={{ color: "#8a8278", fontSize: "0.875rem", margin: 0 }}>
              This module is coming soon.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}