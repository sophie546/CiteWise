// module3/synthesis-draft/components/GeneratedIntroduction.jsx
import { useState, useRef } from "react";
import ExportDropdown from "./ExportDropdown";

export default function GeneratedIntroduction({ generationStatus, content, references }) {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleExport = (format) => {
    setExportDropdownOpen(false);
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `citewise_introduction_synthesis.${format.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    setExportDropdownOpen(false);
    navigator.clipboard.writeText(content);
  };

  const defaultContent = `1. Introduction

In recent years, the intersection of advanced artificial intelligence and research synthesis has emerged as a cornerstone of modern digital scholarship (Vaswani et al., 2017). Standard methods of literature evaluation often suffer from cognitive overload, forcing researchers to manually reconcile disparate data sources, statistical tables, and thematic findings. By utilizing semantic embedding matrices and large language models (LLMs), automated tools can now systematically map connections across high-density research corpora (Smith & Jones, 2022).

Moreover, the integration of structured document parsing algorithms ensures that semantic retrieval remains contextually grounded, drastically reducing hallucination rates while preserving the academic integrity of the original source materials (Brown, 2023). This synthesis demonstrates that automated validation pipelines not only accelerate the initial review phase but also enhance the reliability of subsequent literature reviews by establishing rigorous verification metrics.`;

  const defaultReferences = [
    "Brown, A. (2023). Contextual Grounding and Hallucination Mitigation in Document Parsing. Journal of Semantic Architecture, 14(2), 112-128.",
    "Smith, J., & Jones, M. (2022). Mapping High-Density Corpora with Transformer Embeddings. Academic AI Quarterly, 8(4), 245-261.",
    "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30.",
  ];

  const displayContent = content || defaultContent;
  const displayReferences = references || defaultReferences;

  return (
    <div style={styles.card}>
      {/* Header Bar */}
      <div style={styles.header}>
        <span style={styles.title}>Generated Introduction</span>
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            disabled={generationStatus !== "complete"}
            style={{
              ...styles.exportButton,
              background: generationStatus === "complete" ? "#D85A30" : "rgba(0, 0, 0, 0.15)",
              color: generationStatus === "complete" ? "#f0ece6" : "#8a8278",
              cursor: generationStatus === "complete" ? "pointer" : "not-allowed",
            }}
          >
            Export
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path
                d="M1 1L5 5L9 1"
                stroke={generationStatus === "complete" ? "#f0ece6" : "#8a8278"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <ExportDropdown
            isOpen={exportDropdownOpen}
            onExport={handleExport}
            onCopy={copyToClipboard}
          />
        </div>
      </div>

      {/* Main Body */}
      <div style={styles.body}>
        {/* Idle State */}
        {generationStatus === "idle" && (
          <div style={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-2 14H7v-2h10v2Zm0-4H7v-2h10v2Zm0-4H7V7h10v2Z"
                fill="#f0ece6"
                opacity="0.7"
              />
            </svg>
            <h3 style={styles.emptyStateTitle}>No Content Generated Yet</h3>
            <p style={styles.emptyStateText}>
              Click "Draft Introduction" to generate synthesized content with APA citations
            </p>
          </div>
        )}

        {/* Generating State */}
        {generationStatus === "generating" && (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <span style={styles.loadingText}>Drafting Synthesis...</span>
          </div>
        )}

        {/* Complete State */}
        {generationStatus === "complete" && (
          <div style={styles.content}>
            <div dangerouslySetInnerHTML={{ __html: formatContent(displayContent) }} />
            
            <div style={styles.referencesDivider} />
            
            <h3 style={styles.referencesTitle}>References</h3>
            <div style={styles.referencesList}>
              {displayReferences.map((ref, idx) => (
                <div key={idx} style={styles.referenceItem}>
                  {ref}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const formatContent = (content) => {
  // Simple formatting for demo - in production, use a proper markdown renderer
  return content
    .replace(/## (.*?)\n/g, '<h2 style="font-size: 1.25rem; font-weight: 700; color: #f0ece6; margin-bottom: 16px;">$1</h2>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 20px; text-align: justify;">')
    .replace(/(\([^)]+\))/g, '<span style="color: #e07b39; font-weight: 600; cursor: help; text-decoration: underline dotted;">$1</span>');
};

const styles = {
  card: {
    background: "#1E1C19",
    border: "1px solid #3A3630",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    minHeight: "500px",
  },
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid #3A3630",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(0, 0, 0, 0.15)",
  },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#D98A21",
    letterSpacing: "0.01em",
  },
  exportButton: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.85rem",
    fontWeight: "700",
    transition: "background 0.2s ease",
  },
  body: {
    flex: 1,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    background: "#1E1C19",
    overflowY: "auto",
  },
  emptyState: {
    flex: 1,
    border: "1px dashed #3A3630",
    borderRadius: "8px",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    background: "rgba(0, 0, 0, 0.15)",
  },
  emptyStateTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: "1.1rem",
    color: "#f0ece6",
    margin: "0 0 8px 0",
  },
  emptyStateText: {
    color: "#8a8278",
    fontSize: "0.875rem",
    lineHeight: "1.5",
    maxWidth: "400px",
    margin: 0,
  },
  loadingState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "3px solid #333028",
    borderTop: "3px solid #e07b39",
    borderRadius: "50%",
    animation: "progress-bar-stripes 1s linear infinite",
  },
  loadingText: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#8a8278",
  },
  content: {
    animation: "slideIn 0.4s ease",
    lineHeight: "1.7",
    fontSize: "0.95rem",
    color: "#f0ece6",
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
  },
  referencesDivider: {
    margin: "40px 0 20px 0",
    height: "1px",
    background: "#333028",
  },
  referencesTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#D85A30",
    marginBottom: "12px",
    fontFamily: "'Poppins', sans-serif",
  },
  referencesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontSize: "0.8rem",
    color: "#8a8278",
  },
  referenceItem: {
    lineHeight: "1.5",
  },
};