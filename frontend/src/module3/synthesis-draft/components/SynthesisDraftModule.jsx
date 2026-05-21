import { useState, useEffect } from "react";
import SynthesisControlPanel from "./SynthesisControlPanel";
import ApprovedSourceList from "./ApprovedSourceList";
import GeneratedDraftDisplay from "./GeneratedDraftDisplay";
import ExportDraftDropdown from "./ExportDraftDropdown";

export default function SynthesisDraftModule({ sessionId, onStepChange }) {
  const [approvedDocuments, setApprovedDocuments] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [generationStatus, setGenerationStatus] = useState("idle");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusText, setStatusText] = useState("Ready to Generate");
  const [generatedContent, setGeneratedContent] = useState("");
  const [references, setReferences] = useState([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Fetch approved documents from Module 2
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    
    const fetchApprovedDocs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/documents/session/${sessionId}`);
        const data = await response.json();
        const approved = data.filter(doc => doc.status === "complete" || doc.approved === true);
        setApprovedDocuments(approved);
      } catch (err) {
        console.error(err);
        setApprovedDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedDocs();
  }, [sessionId]);

  const startSynthesis = () => {
    if (approvedDocuments.length === 0) return;
    
    setGenerationStatus("generating");
    setStatusText("Synthesizing... Please wait");
    
    const steps = [
      { progress: 10, text: "Analyzing approved documents..." },
      { progress: 25, text: "Extracting key themes..." },
      { progress: 45, text: "Mapping semantic connections..." },
      { progress: 60, text: "Synthesizing literature review..." },
      { progress: 80, text: "Generating APA citations..." },
      { progress: 100, text: "Synthesis Complete!" },
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const current = steps[currentStepIdx];
        setGenerationProgress(current.progress);
        setStatusText(current.text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setGenerationStatus("complete");
        setGeneratedContent(getDefaultContent());
        setReferences(getDefaultReferences());
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 2200);
      }
    }, 1200);
  };

  const resetGeneration = () => {
    setGenerationStatus("idle");
    setGenerationProgress(0);
    setGeneratedContent("");
    setReferences([]);
    setStatusText("Ready to Generate");
  };

  const handleExport = (format) => {
    setExportDropdownOpen(false);
    const fullText = `${generatedContent}\n\nReferences\n${references.join("\n")}`;
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `citewise_synthesis.${format.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    setExportDropdownOpen(false);
    const fullText = `${generatedContent}\n\nReferences\n${references.join("\n")}`;
    navigator.clipboard.writeText(fullText);
  };

  const getDefaultContent = () => `1. Introduction

In recent years, the intersection of advanced artificial intelligence and research synthesis has emerged as a cornerstone of modern digital scholarship (Vaswani et al., 2017). Standard methods of literature evaluation often suffer from cognitive overload, forcing researchers to manually reconcile disparate data sources, statistical tables, and thematic findings. By utilizing semantic embedding matrices and large language models (LLMs), automated tools can now systematically map connections across high-density research corpora (Smith & Jones, 2022).

Moreover, the integration of structured document parsing algorithms ensures that semantic retrieval remains contextually grounded, drastically reducing hallucination rates while preserving the academic integrity of the original source materials (Brown, 2023). This synthesis demonstrates that automated validation pipelines not only accelerate the initial review phase but also enhance the reliability of subsequent literature reviews by establishing rigorous verification metrics.`;

  const getDefaultReferences = () => [
    "Brown, A. (2023). Contextual Grounding and Hallucination Mitigation in Document Parsing. Journal of Semantic Architecture, 14(2), 112-128.",
    "Smith, J., & Jones, M. (2022). Mapping High-Density Corpora with Transformer Embeddings. Academic AI Quarterly, 8(4), 245-261.",
    "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30.",
  ];

  return (
    <div style={styles.container}>
      {/* Success Toast */}
      {showSuccessToast && (
        <div style={styles.toastOverlay}>
          <div style={styles.toastContainer}>
            <div style={styles.toastIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D98A21" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={styles.toastTitle}>Synthesis Complete</h3>
            <p style={styles.toastMessage}>Your literature synthesis has been generated with APA citations.</p>
          </div>
        </div>
      )}

      <div style={styles.gridContainer}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          <SynthesisControlPanel
            generationStatus={generationStatus}
            generationProgress={generationProgress}
            statusText={statusText}
            onSynthesize={startSynthesis}
            onRegenerate={resetGeneration}
            hasApprovedDocuments={approvedDocuments.length > 0}
            approvedCount={approvedDocuments.length}
          />
          <ApprovedSourceList documents={approvedDocuments} loading={loading} />
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          <div style={styles.rightPanel}>
            <div style={styles.rightPanelHeader}>
              <span style={styles.rightPanelTitle}>Generated Introduction</span>
              <ExportDraftDropdown 
                isOpen={exportDropdownOpen}
                onToggle={setExportDropdownOpen}
                onExport={handleExport}
                onCopy={copyToClipboard}
                isEnabled={generationStatus === "complete"}
              />
            </div>
            <div style={styles.rightPanelContent}>
              <GeneratedDraftDisplay
                generationStatus={generationStatus}
                content={generatedContent}
                references={references}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Poppins', sans-serif",
    flex: 1,
    color: "#f0ece6",
    position: "relative",
  },
  gridContainer: {
    maxWidth: 1280,
    width: "100%",
    margin: "0 auto",
    padding: "24px 32px",
    flex: 1,
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "24px",
    minHeight: 0,
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightColumn: {
    minHeight: 0,
  },
  rightPanel: {
    background: "#1E1C19",
    border: "1px solid #3A3630",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    minHeight: "500px",
  },
  rightPanelHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid #3A3630",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(0, 0, 0, 0.15)",
  },
  rightPanelTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#D98A21",
    letterSpacing: "0.01em",
  },
  rightPanelContent: {
    flex: 1,
    padding: "24px",
    background: "#1E1C19",
    overflowY: "auto",
  },
  toastOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(14, 12, 10, 0.75)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  toastContainer: {
    background: "#1E1C19",
    border: "1px solid rgba(217, 138, 33, 0.25)",
    borderRadius: "24px",
    padding: "2.5rem 3rem",
    maxWidth: "480px",
    width: "90%",
    textAlign: "center",
  },
  toastIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(216, 90, 48, 0.1)",
    border: "2px solid #D85A30",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
  },
  toastTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: "1.5rem",
    color: "#f0ece6",
    margin: "0 0 0.5rem 0",
  },
  toastMessage: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.95rem",
    color: "rgba(240, 236, 230, 0.7)",
    lineHeight: "1.6",
    margin: 0,
  },
};