// module3/synthesis-draft/components/SynthesisDraftWorkspace.jsx
import { useState, useEffect } from "react";
import SynthesisControlCard from "./SynthesisControlCard";
import SourceDocumentsCard from "./SourceDocumentsCard";
import GeneratedIntroduction from "./GeneratedIntroduction";
import SuccessToast from "./SuccessToast";

const fallbackDocs = [
  { name: "Document_001.pdf" },
  { name: "Document_002.pdf" },
  { name: "Document_003.pdf" },
];

export default function SynthesisDraftWorkspace({ sessionId, onStepChange }) {
  const STORAGE_SESSION_KEY = "citewise.sessionId";
  const resolvedSessionId = sessionId || localStorage.getItem(STORAGE_SESSION_KEY) || "";
  
  // Documents state
  const [documents, setDocuments] = useState(fallbackDocs);
  
  // Generation state
  const [generationStatus, setGenerationStatus] = useState("idle");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusText, setStatusText] = useState("Ready to Generate");
  const [generatedContent, setGeneratedContent] = useState("");
  const [references, setReferences] = useState([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Fetch documents
  useEffect(() => {
    if (!resolvedSessionId) {
      setDocuments(fallbackDocs);
      return;
    }

    const fetchSessionDocs = async () => {
      try {
        const response = await fetch(`/api/v1/documents/session/${resolvedSessionId}`);
        if (!response.ok) {
          setDocuments(fallbackDocs);
          return;
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const approved = data.filter((d) => d.status === "complete" || d.approved);
          const mapped = approved.map((doc) => ({
            name: doc.fileName || "Untitled.pdf",
          }));
          setDocuments(mapped.length > 0 ? mapped : data.map(d => ({ name: d.fileName })));
        } else {
          setDocuments(fallbackDocs);
        }
      } catch (err) {
        console.warn("Using fallback documents for display:", err);
        setDocuments(fallbackDocs);
      }
    };

    fetchSessionDocs();
  }, [resolvedSessionId]);

  // Start generation
  const startGeneration = () => {
    if (generationStatus === "generating") return;

    setGenerationStatus("generating");
    setGenerationProgress(0);
    setStatusText("Scanning source documents...");

    const steps = [
      { progress: 20, text: "Analyzing semantic matrices..." },
      { progress: 45, text: "Synthesizing thematic insights..." },
      { progress: 70, text: "Drafting introduction text..." },
      { progress: 90, text: "Adding APA citations..." },
      { progress: 100, text: "Generation Complete!" },
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
    setStatusText("Ready to Generate");
    setGeneratedContent("");
    setReferences([]);
  };

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      <SuccessToast show={showSuccessToast} onClose={() => setShowSuccessToast(false)} />

      <style dangerouslySetInnerHTML={{ __html: styles.animations }} />

      {/* Main Structural Grid */}
      <div style={styles.gridContainer}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          <SynthesisControlCard
            generationStatus={generationStatus}
            generationProgress={generationProgress}
            statusText={statusText}
            onGenerate={startGeneration}
            onRegenerate={resetGeneration}
          />
          <SourceDocumentsCard documents={documents} />
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          <GeneratedIntroduction
            generationStatus={generationStatus}
            content={generatedContent}
            references={references}
          />
        </div>
      </div>
    </div>
  );
}

const getDefaultContent = () => `1. Introduction

In recent years, the intersection of advanced artificial intelligence and research synthesis has emerged as a cornerstone of modern digital scholarship (Vaswani et al., 2017). Standard methods of literature evaluation often suffer from cognitive overload, forcing researchers to manually reconcile disparate data sources, statistical tables, and thematic findings. By utilizing semantic embedding matrices and large language models (LLMs), automated tools can now systematically map connections across high-density research corpora (Smith & Jones, 2022).

Moreover, the integration of structured document parsing algorithms ensures that semantic retrieval remains contextually grounded, drastically reducing hallucination rates while preserving the academic integrity of the original source materials (Brown, 2023). This synthesis demonstrates that automated validation pipelines not only accelerate the initial review phase but also enhance the reliability of subsequent literature reviews by establishing rigorous verification metrics.`;

const getDefaultReferences = () => [
  "Brown, A. (2023). Contextual Grounding and Hallucination Mitigation in Document Parsing. Journal of Semantic Architecture, 14(2), 112-128.",
  "Smith, J., & Jones, M. (2022). Mapping High-Density Corpora with Transformer Embeddings. Academic AI Quarterly, 8(4), 245-261.",
  "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30.",
];

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
  animations: `
    @keyframes fadeInToast {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleInToast {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes pulseRing {
      0%, 100% { box-shadow: 0 0 20px rgba(216, 90, 48, 0.2); }
      50% { box-shadow: 0 0 40px rgba(216, 90, 48, 0.4); }
    }
    @keyframes drawCheckmark {
      to { stroke-dashoffset: 0; }
    }
    @keyframes fillProgress {
      to { width: 100%; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes progress-bar-stripes {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
};