import { useState, useEffect } from "react";
import GlobalNavigationBar from "./shared/components/GlobalNavigationBar";
import WorkspaceImportLayout from "./module1/catalyst-import/components/WorkspaceImportLayout";
import ValidationDashboardLayout from "./module2/literature-review/components/ValidationDashboardLayout";
import SynthesisDraftWorkspace from "./module3/synthesis-draft/components/SynthesisDraftWorkspace";
import LandingPage from "./landing_page/LandingPage";

/**
 * App.jsx – CiteWise root
 *
 * Step -1 → Landing Page
 * Step 0  →  Data Import        (WorkspaceImportLayout)
 * Step 1  →  AI Assessment      (ValidationDashboardLayout)
 * Step 2  →  Generate Introduction (SynthesisDraftLayout)
 *
 */
export default function App() {
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("citewise.step");
    return saved !== null ? parseInt(saved, 10) : -1;
  });
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem("citewise.sessionId") || "";
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("citewise.step", step.toString());
  }, [step]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("citewise.sessionId", sessionId);
    }
  }, [sessionId]);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      setStep(0);
      setIsLoading(false);
    }, 800);
  };

  const handleLogoClick = () => {
    setStep(-1);
    // Optional: Clear session if you want to reset everything
    // setSessionId("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#1E1C19" }}>

      {step !== -1 && (
        <GlobalNavigationBar 
          currentStep={step} 
          onNavigate={setStep}
          onLogoClick={handleLogoClick}
        />
      )}

      <main style={{
        flex: 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}>

        {step === -1 && (
          <LandingPage onGetStarted={handleGetStarted} isLoading={isLoading} />
        )}

        {step === 0 && (
          <WorkspaceImportLayout
            onImportSuccess={(sid) => setSessionId(sid)}
            onProceed={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <ValidationDashboardLayout
            sessionId={sessionId}
            onStepChange={setStep}
          />
        )}

        {/* Module 3 – Generate Introduction */}
        {step === 2 && (
          <SynthesisDraftWorkspace
            sessionId={sessionId}
            onStepChange={setStep}
          />
        )}

      </main>
    </div>
  );
}