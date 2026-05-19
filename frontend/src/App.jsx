import { useState } from "react";
// import WorkspaceImportLayout from "./features/catalyst-import/components/WorkspaceImportLayout";
import ValidationDashboardLayout from "./module2/literature-review/components/ValidationDashboardLayout";
// import SynthesisDraftLayout from "./features/proposal-drafting/components/SynthesisDraftLayout";

export default function App() {
  const [currentModuleStep, setCurrentModuleStep] = useState(1); // Defaulting to Module 2 for showcase
  const [activeSessionId, setActiveSessionId] = useState("session-uuid-token-string");

  return (
    <ValidationDashboardLayout 
      sessionId={activeSessionId} 
      onStepChange={setCurrentModuleStep} 
    />
  );
}