  import { useState, useEffect } from "react";
  import SynthesisControlPanel from "./SynthesisControlPanel";
  import ApprovedSourceList from "./ApprovedSourceList";
  import GeneratedDraftDisplay from "./GeneratedDraftDisplay";
  import ExportDraftDropdown from "./ExportDraftDropdown";

  // Rest of your code...

  export default function SynthesisDraftModule({ sessionId, onStepChange }) {
    const [approvedDocuments, setApprovedDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generationStatus, setGenerationStatus] = useState("idle");
    const [generationProgress, setGenerationProgress] = useState(0);
    const [statusText, setStatusText] = useState("Ready to Generate");
    const [generatedContent, setGeneratedContent] = useState("");
    const [references, setReferences] = useState([]);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const DRAFT_STORAGE_KEY = `citewise_draft_${sessionId}`;
    const DOCS_STORAGE_KEY = `citewise_approved_docs_${sessionId}`;

    // Load saved draft on mount
    useEffect(() => {
      if (sessionId) {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setGeneratedContent(draft.content || "");
            setReferences(draft.references || []);
            if (draft.content && draft.content.length > 0) {
              setGenerationStatus("complete");
            }
            console.log("Loaded saved draft from localStorage");
          } catch (err) {
            console.error("Error loading saved draft:", err);
          }
        }
      }
    }, [sessionId]);

    // Save draft whenever it changes
    useEffect(() => {
      if (sessionId && generatedContent) {
        const draftToSave = {
          content: generatedContent,
          references: references,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftToSave));
        console.log("Saved draft to localStorage");
      }
    }, [generatedContent, references, sessionId]);

    // Fetch approved documents - ACCUMULATE instead of replace
    useEffect(() => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      
      const loadApprovedDocuments = async () => {
        setLoading(true);
        
        // Get existing approved documents from localStorage first
        let existingDocs = [];
        const storedApproved = localStorage.getItem(DOCS_STORAGE_KEY);
        
        if (storedApproved) {
          try {
            existingDocs = JSON.parse(storedApproved);
            console.log("Existing approved documents from localStorage:", existingDocs);
          } catch (err) {
            console.error("Error parsing stored approved docs:", err);
          }
        }
        
        // Fetch current approved documents from Module 2
        try {
          console.log("Fetching current approved documents from Module 2...");
          const response = await fetch(`/api/v1/documents/session/${sessionId}`, {
            headers: {
              'X-Session-Id': sessionId,
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log("API response data (all documents):", data);
          
          // Get newly approved documents
          const newlyApproved = data.filter(doc => {
            return doc.approved === true || doc.status === "complete";
          });
          
          console.log("Newly approved documents from Module 2:", newlyApproved);
          
          // MERGE: Combine existing docs with new docs, avoid duplicates
          const mergedDocs = [...existingDocs];
          
          newlyApproved.forEach(newDoc => {
            // Check if document already exists (by id or fileName)
            const exists = mergedDocs.some(existing => 
              existing.id === newDoc.id || 
              existing.fileName === newDoc.fileName
            );
            
            if (!exists) {
              console.log("Adding new document:", newDoc.fileName);
              mergedDocs.push(newDoc);
            } else {
              console.log("Document already exists, skipping:", newDoc.fileName);
            }
          });
          
          console.log("Merged approved documents:", mergedDocs);
          setApprovedDocuments(mergedDocs);
          
          // Save merged list back to localStorage
          if (mergedDocs.length > 0) {
            localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(mergedDocs));
          }
          
        } catch (err) {
          console.error("Error fetching documents:", err);
          // If API fails, keep existing docs
          if (existingDocs.length > 0) {
            setApprovedDocuments(existingDocs);
          } else {
            setApprovedDocuments([]);
          }
        } finally {
          setLoading(false);
        }
      };
      
      loadApprovedDocuments();
    }, [sessionId]);

    // Listen for storage events (when Module 2 saves new approved docs)
    useEffect(() => {
      const handleStorageChange = (e) => {
        if (e.key === DOCS_STORAGE_KEY && e.newValue) {
          try {
            const newDocs = JSON.parse(e.newValue);
            console.log("Storage updated - new approved documents from Module 2:", newDocs);
            
            // MERGE with existing documents instead of replacing
            setApprovedDocuments(prevDocs => {
              const merged = [...prevDocs];
              newDocs.forEach(newDoc => {
                const exists = merged.some(existing => 
                  existing.id === newDoc.id || 
                  existing.fileName === newDoc.fileName
                );
                if (!exists) {
                  console.log("Adding new document from storage event:", newDoc.fileName);
                  merged.push(newDoc);
                }
              });
              console.log("After merge:", merged);
              // Save merged back to localStorage
              localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(merged));
              return merged;
            });
          } catch (err) {
            console.error("Error parsing storage update:", err);
          }
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [DOCS_STORAGE_KEY]);

    const startSynthesis = async () => {
      if (approvedDocuments.length === 0) {
        setStatusText("No approved documents available. Please approve documents in AI Assessment first.");
        return;
      }
      if (!sessionId) {
        setStatusText("No session ID — import a workspace first.");
        return;
      }

      setGenerationStatus("generating");
      setStatusText("Synthesizing... Please wait");
      setGenerationProgress(10);

      const steps = [
        { progress: 25, text: "Extracting key themes..." },
        { progress: 45, text: "Mapping semantic connections..." },
        { progress: 65, text: "Synthesizing literature review..." },
        { progress: 85, text: "Generating APA citations..." },
      ];
      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          setGenerationProgress(steps[stepIdx].progress);
          setStatusText(steps[stepIdx].text);
          stepIdx++;
        }
      }, 1200);

      try {
        const response = await fetch(
          `/api/v1/synthesis/generate?sessionId=${encodeURIComponent(sessionId)}`,
          { method: "POST" }
        );
        const payload = await response.json().catch(() => null);
        clearInterval(interval);

        if (!response.ok || !payload || payload.success === false) {
          throw new Error(payload?.message || `Synthesis failed (HTTP ${response.status})`);
        }

        const refsArray = (payload.referencesText || "")
          .split("\n")
          .map((ref) => ref.trim())
          .filter((ref) => ref.length > 0);

        const existingContent = generatedContent || "";
        const newContent = payload.contentText || "";
        
        let mergedContent = newContent;
        let mergedReferences = refsArray;
        
        if (existingContent && existingContent.length > 0) {
          if (!existingContent.includes(newContent.substring(0, 100))) {
            mergedContent = existingContent + "\n\n---\n\n" + newContent;
            const existingRefs = references || [];
            const newRefsSet = new Set([...existingRefs, ...refsArray]);
            mergedReferences = Array.from(newRefsSet);
          }
        }

        setGenerationProgress(100);
        setStatusText("Synthesis Complete!");
        setGenerationStatus("complete");
        setGeneratedContent(mergedContent);
        setReferences(mergedReferences);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 2200);
        
        const draftToSave = {
          content: mergedContent,
          references: mergedReferences,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftToSave));
        
      } catch (err) {
        clearInterval(interval);
        console.error("Synthesis error:", err);
        setGenerationStatus("idle");
        setGenerationProgress(0);
        setStatusText(err.message || "Synthesis failed");
      }
    };

    const resetGeneration = () => {
      setGenerationStatus("idle");
      setGenerationProgress(0);
      setGeneratedContent("");
      setReferences([]);
      setStatusText("Ready to Generate");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
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

    return (
      <div style={styles.container}>
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