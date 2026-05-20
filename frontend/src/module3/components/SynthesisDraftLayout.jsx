import { useState, useEffect, useRef } from "react";

export default function SynthesisDraftLayout({ sessionId, onStepChange }) {
  const STORAGE_SESSION_KEY = "citewise.sessionId";
  const [resolvedSessionId] = useState(
    () => sessionId || localStorage.getItem(STORAGE_SESSION_KEY) || ""
  );

  // States
  const [documents, setDocuments] = useState([]);
  const [generationStatus, setGenerationStatus] = useState("idle"); // 'idle' | 'generating' | 'complete'
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusText, setStatusText] = useState("Ready to Generate");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // 'success' | 'info'

  const dropdownRef = useRef(null);

  // Fallback documents if none are fetched
  const fallbackDocs = [
    { name: "Document_001.pdf" },
    { name: "Document_002.pdf" },
    { name: "Document_003.pdf" }
  ];

  // Fetch approved documents from the current session
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
          // Filter to approved ones, or fallback to all if none are approved yet
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

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Run the mock generation process
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
      { progress: 100, text: "Generation Complete!" }
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
        showToast("Introduction drafted successfully!");
      }
    }, 1200);
  };

  // Helper for displaying toast notifications
  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const handleExport = (format) => {
    setExportDropdownOpen(false);
    showToast(`Exported successfully as ${format}!`, "success");
    
    // Trigger mock file download
    const element = document.createElement("a");
    const file = new Blob([generatedIntroductionText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `citewise_introduction_synthesis.${format.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    setExportDropdownOpen(false);
    navigator.clipboard.writeText(generatedIntroductionText);
    showToast("Copied to clipboard!", "success");
  };

  const resetGeneration = () => {
    setGenerationStatus("idle");
    setGenerationProgress(0);
    setStatusText("Ready to Generate");
  };

  const generatedIntroductionText = `1. Introduction\n\nIn recent years, the intersection of advanced artificial intelligence and research synthesis has emerged as a cornerstone of modern digital scholarship (Vaswani et al., 2017). Standard methods of literature evaluation often suffer from cognitive overload, forcing researchers to manually reconcile disparate data sources, statistical tables, and thematic findings. By utilizing semantic embedding matrices and large language models (LLMs), automated tools can now systematically map connections across high-density research corpora (Smith & Jones, 2022).\n\nMoreover, the integration of structured document parsing algorithms ensures that semantic retrieval remains contextually grounded, drastically reducing hallucination rates while preserving the academic integrity of the original source materials (Brown, 2023). This synthesis demonstrates that automated validation pipelines not only accelerate the initial review phase but also enhance the reliability of subsequent literature reviews by establishing rigorous verification metrics.`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Poppins', sans-serif",
        flex: 1,
        color: "#f0ece6",
        position: "relative",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "32px",
            background: toastType === "success" ? "#e07b39" : "#2a2724",
            border: "1px solid #333028",
            color: "#f0ece6",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideIn 0.3s ease",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 15A6 6 0 1 0 9 3a6 6 0 0 0 0 12Z"
              stroke="#f0ece6"
              strokeWidth="1.5"
            />
            <path
              d="M7.5 9.5L8.5 10.5L10.5 7.5"
              stroke="#f0ece6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Style Animations (Injected dynamically) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .progress-bar-shine {
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background-image: linear-gradient(
            -45deg,
            rgba(255, 255, 255, .15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, .15) 50%,
            rgba(255, 255, 255, .15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 40px 40px;
          animation: progress-bar-stripes 2s linear infinite;
        }
        @keyframes progress-bar-stripes {
          from { background-position: 40px 0; }
          to { background-position: 0 0; }
        }
      `}} />

      {/* Main Structural Flex/Grid Row Container */}
      <div
        style={{
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "24px 32px",
          flex: 1,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "24px",
          minHeight: 0,
        }}
      >
        {/* Left Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Card 1: Synthesis Control */}
          <div
            style={{
              background: "#201d1a",
              border: "1px solid #333028",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#e07b39",
                letterSpacing: "0.01em",
              }}
            >
              Synthesis Control
            </span>

            <div style={{ height: "1px", background: "#333028" }} />

            {/* Generation Status Box */}
            <div
              style={{
                background: "#252220",
                border: "1px solid #333028",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#8a8278",
                }}
              >
                Generation Status
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: generationStatus === "complete" ? "#e07b39" : "#f0ece6",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {generationStatus === "generating" && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#e07b39",
                      display: "inline-block",
                      animation: "pulse 1.2s infinite",
                    }}
                  />
                )}
                {statusText}
              </span>

              {/* Progress Bar (Visible during generating) */}
              {generationStatus === "generating" && (
                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    background: "#1a1714",
                    borderRadius: "2px",
                    marginTop: "8px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${generationProgress}%`,
                      height: "100%",
                      background: "#e07b39",
                      borderRadius: "2px",
                      transition: "width 0.4s ease",
                      position: "relative",
                    }}
                  >
                    <div className="progress-bar-shine" />
                  </div>
                </div>
              )}
            </div>

            {/* Draft Introduction Action Button */}
            {generationStatus !== "complete" ? (
              <button
                onClick={startGeneration}
                disabled={generationStatus === "generating"}
                style={{
                  background: generationStatus === "generating" ? "#2a2724" : "#e07b39",
                  color: generationStatus === "generating" ? "#8a8278" : "#f0ece6",
                  border: "none",
                  borderRadius: "10px",
                  padding: "14px",
                  cursor: generationStatus === "generating" ? "not-allowed" : "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  transition: "background 0.2s ease, transform 0.1s ease",
                  textAlign: "center",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (generationStatus !== "generating") e.currentTarget.style.background = "#c96d2e";
                }}
                onMouseLeave={(e) => {
                  if (generationStatus !== "generating") e.currentTarget.style.background = "#e07b39";
                }}
                onMouseDown={(e) => {
                  if (generationStatus !== "generating") e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  if (generationStatus !== "generating") e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {generationStatus === "generating" ? `Drafting (${generationProgress}%)` : "Draft Introduction"}
              </button>
            ) : (
              <button
                onClick={resetGeneration}
                style={{
                  background: "transparent",
                  color: "#e07b39",
                  border: "1px solid #e07b39",
                  borderRadius: "10px",
                  padding: "14px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  transition: "background 0.2s ease, color 0.2s ease",
                  textAlign: "center",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e07b39";
                  e.currentTarget.style.color = "#f0ece6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#e07b39";
                }}
              >
                Clear & Regenerate
              </button>
            )}
          </div>

          {/* Card 2: Source Documents */}
          <div
            style={{
              background: "#201d1a",
              border: "1px solid #333028",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#e07b39",
                letterSpacing: "0.01em",
              }}
            >
              Source Documents
            </span>

            <div style={{ height: "1px", background: "#333028" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#252220",
                    border: "1px solid #333028",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#f0ece6",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      maxWidth: "220px",
                    }}
                    title={doc.name}
                  >
                    {doc.name}
                  </span>

                  {/* Checked Indicator */}
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#e07b39",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="#f0ece6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Generated Introduction */}
        <div
          style={{
            background: "#201d1a",
            border: "1px solid #333028",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: "500px",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #333028",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#201d1a",
            }}
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#e07b39",
                letterSpacing: "0.01em",
              }}
            >
              Generated Introduction
            </span>

            {/* Export Dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                disabled={generationStatus !== "complete"}
                style={{
                  background: generationStatus === "complete" ? "#e07b39" : "#2a2724",
                  color: generationStatus === "complete" ? "#f0ece6" : "#8a8278",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: generationStatus === "complete" ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  transition: "background 0.2s ease",
                }}
              >
                Export
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  style={{
                    transform: exportDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke={generationStatus === "complete" ? "#f0ece6" : "#8a8278"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {exportDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#252220",
                    border: "1px solid #333028",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                    zIndex: 200,
                    width: "200px",
                    overflow: "hidden",
                    animation: "slideIn 0.15s ease",
                  }}
                >
                  <button
                    onClick={() => handleExport("PDF")}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#302b27")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Export as PDF (.pdf)
                  </button>
                  <button
                    onClick={() => handleExport("DOCX")}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#302b27")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Export as Word (.docx)
                  </button>
                  <button
                    onClick={() => handleExport("TXT")}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#302b27")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Export as Plain Text (.txt)
                  </button>
                  <div style={{ height: "1px", background: "#333028" }} />
                  <button
                    onClick={copyToClipboard}
                    style={{ ...dropdownItemStyle, color: "#e07b39" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#302b27")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Body Viewport */}
          <div
            style={{
              flex: 1,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              background: "#1e1b19",
              overflowY: "auto",
            }}
          >
            {/* Idle State: No content generated yet */}
            {generationStatus === "idle" && (
              <div
                style={{
                  flex: 1,
                  border: "1px dashed #3e3a34",
                  borderRadius: "8px",
                  padding: "48px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  background: "rgba(37, 34, 32, 0.3)",
                }}
              >
                {/* SVG Document Icon */}
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginBottom: "16px" }}
                >
                  <path
                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-2 14H7v-2h10v2Zm0-4H7v-2h10v2Zm0-4H7V7h10v2Z"
                    fill="#f0ece6"
                    opacity="0.7"
                  />
                </svg>
                
                <h3
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    color: "#f0ece6",
                    margin: "0 0 8px 0",
                  }}
                >
                  No Content Generated Yet
                </h3>
                <p
                  style={{
                    color: "#8a8278",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    maxWidth: "400px",
                    margin: 0,
                  }}
                >
                  Click &ldquo;Draft Introduction&rdquo; to generate synthesized content with APA citations
                </p>
              </div>
            )}

            {/* Generating State */}
            {generationStatus === "generating" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                {/* Custom Elegant Spinner */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "3px solid #333028",
                    borderTop: "3px solid #e07b39",
                    borderRadius: "50%",
                    animation: "progress-bar-stripes 1s linear infinite",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#8a8278",
                  }}
                >
                  Drafting Synthesis...
                </span>
              </div>
            )}

            {/* Complete State */}
            {generationStatus === "complete" && (
              <div
                style={{
                  animation: "slideIn 0.4s ease",
                  lineHeight: "1.7",
                  fontSize: "0.95rem",
                  color: "#f0ece6",
                  maxWidth: "800px",
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#f0ece6",
                    marginBottom: "16px",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  1. Introduction
                </h2>
                
                <p style={{ marginBottom: "20px", textAlign: "justify" }}>
                  In recent years, the intersection of advanced artificial intelligence and research synthesis has emerged as a cornerstone of modern digital scholarship{" "}
                  <span
                    style={citationStyle}
                    title="Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). Attention is all you need."
                  >
                    (Vaswani et al., 2017)
                  </span>
                  . Standard methods of literature evaluation often suffer from cognitive overload, forcing researchers to manually reconcile disparate data sources, statistical tables, and thematic findings. By utilizing semantic embedding matrices and large language models (LLMs), automated tools can now systematically map connections across high-density research corpora{" "}
                  <span
                    style={citationStyle}
                    title="Smith, J., & Jones, M. (2022). Mapping High-Density Corpora with Transformer Embeddings."
                  >
                    (Smith & Jones, 2022)
                  </span>
                  .
                </p>

                <p style={{ marginBottom: "24px", textAlign: "justify" }}>
                  Moreover, the integration of structured document parsing algorithms ensures that semantic retrieval remains contextually grounded, drastically reducing hallucination rates while preserving the academic integrity of the original source materials{" "}
                  <span
                    style={citationStyle}
                    title="Brown, A. (2023). Contextual Grounding and Halicination Mitigation in Document Parsing."
                  >
                    (Brown, 2023)
                  </span>
                  . This synthesis demonstrates that automated validation pipelines not only accelerate the initial review phase but also enhance the reliability of subsequent literature reviews by establishing rigorous verification metrics.
                </p>

                {/* References Divider */}
                <div style={{ margin: "40px 0 20px 0", height: "1px", background: "#333028" }} />
                
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#e07b39",
                    marginBottom: "12px",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  References
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem", color: "#8a8278" }}>
                  <div>
                    Brown, A. (2023). <em>Contextual Grounding and Hallucination Mitigation in Document Parsing</em>. Journal of Semantic Architecture, 14(2), 112-128.
                  </div>
                  <div>
                    Smith, J., & Jones, M. (2022). <em>Mapping High-Density Corpora with Transformer Embeddings</em>. Academic AI Quarterly, 8(4), 245-261.
                  </div>
                  <div>
                    Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). <em>Attention is all you need</em>. Advances in Neural Information Processing Systems, 30.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Styles
const dropdownItemStyle = {
  background: "transparent",
  border: "none",
  color: "#f0ece6",
  padding: "10px 16px",
  textAlign: "left",
  width: "100%",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontFamily: "'Poppins', sans-serif",
  display: "block",
  transition: "background 0.2s ease",
};

const citationStyle = {
  color: "#e07b39",
  fontWeight: "600",
  cursor: "help",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
};
