import { useState, useEffect, useCallback, useRef } from "react";
import DocumentActiveCard from "./DocumentActiveCard";
import QuickNavigationList from "./QuickNavigationList";
import AIAssessmentPanel from "../../ai-assessment/components/AIAssessmentPanel";
import ValidationSummaryFooter from "./ValidationSummaryFooter";

export default function ValidationDashboardLayout({ sessionId, onStepChange }) {
  const STORAGE_SESSION_KEY = "citewise.sessionId";

  const [resolvedSessionId, setResolvedSessionId] = useState(
    () => sessionId || localStorage.getItem(STORAGE_SESSION_KEY) || ""
  );

  // Primary list state populated from backend session documents
  const [documents, setDocuments] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeInsights, setActiveInsights] = useState(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsPollExhausted, setInsightsPollExhausted] = useState(false);
  const [assessVersion, setAssessVersion] = useState(0);
  const pollAttemptsRef = useRef(0);
  const MAX_INSIGHTS_POLL_ATTEMPTS = 50;

  // Server-driven aggregate metrics tracking DocumentValidationService properties
  const [batchStats, setBatchStats] = useState({
    approvedCount: 0,
    totalCount: 0,
    averageScore: 0,
  });

  // Success toast for synthesis workflow
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const activeDoc = documents[currentIndex];

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
      setResolvedSessionId(sessionId);
    }
  }, [sessionId]);

  const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined) return "-";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const mapStatus = (status) => (status === "complete" ? "Ready" : "Processing");

  const mapDocuments = (items, previous) => {
    const previousById = new Map((previous || []).map((doc) => [doc.id, doc]));
    return items.map((item) => {
      const prev = previousById.get(item.id);
      return {
        id: item.id,
        name: item.fileName || "Untitled.pdf",
        size: formatBytes(item.sizeBytes),
        pages: prev?.pages ?? "-",
        status: mapStatus(item.status),
        approved: prev?.approved ?? false,
        relevancyScore: item.relevancyScore ?? null,
      };
    });
  };

  const fetchDocuments = useCallback(async () => {
    if (!resolvedSessionId) return;
    try {
      const response = await fetch(`/api/v1/documents/session/${resolvedSessionId}`);
      if (!response.ok) return;
      const data = await response.json();
      setDocuments((prev) => mapDocuments(Array.isArray(data) ? data : [], prev));
    } catch (err) {
      console.warn("Error loading session documents:", err);
    }
  }, [resolvedSessionId]);

  useEffect(() => {
    if (!resolvedSessionId) return;
    fetchDocuments();
    const pollId = setInterval(fetchDocuments, 5000);
    return () => clearInterval(pollId);
  }, [resolvedSessionId, fetchDocuments]);

  useEffect(() => {
    if (currentIndex >= documents.length) {
      setCurrentIndex(0);
    }
  }, [documents.length, currentIndex]);

  // Fetch n8n-backed insights for the selected document; poll until ready (max ~2.5 min)
  useEffect(() => {
    if (!activeDoc?.id) {
      setActiveInsights(null);
      setIsInsightsLoading(false);
      setInsightsPollExhausted(false);
      return;
    }

    let cancelled = false;
    let pollTimeout = null;
    pollAttemptsRef.current = 0;
    setInsightsPollExhausted(false);

    const fetchInsightsData = async () => {
      if (cancelled) return;
      setIsInsightsLoading(true);
      try {
        const response = await fetch(`/api/v1/documents/${activeDoc.id}/insights`, {
          cache: "no-store",
        });
        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          setActiveInsights(data);
          setIsInsightsLoading(false);
          setInsightsPollExhausted(false);
          return;
        }

        if (response.status === 404) {
          setActiveInsights(null);
          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current >= MAX_INSIGHTS_POLL_ATTEMPTS) {
            setIsInsightsLoading(false);
            setInsightsPollExhausted(true);
            return;
          }
          setIsInsightsLoading(false);
          pollTimeout = setTimeout(fetchInsightsData, 3000);
          return;
        }

        setActiveInsights(null);
        setIsInsightsLoading(false);
        setInsightsPollExhausted(true);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching AI Insights:", err);
          setActiveInsights(null);
          setIsInsightsLoading(false);
          setInsightsPollExhausted(true);
        }
      }
    };

    fetchInsightsData();

    return () => {
      cancelled = true;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [activeDoc?.id, assessVersion]);

  const handleAssessDocument = useCallback(async () => {
    if (!activeDoc?.id) return;
    setActiveInsights(null);
    setIsInsightsLoading(true);
    setInsightsPollExhausted(false);
    pollAttemptsRef.current = 0;
    try {
      const response = await fetch(`/api/v1/documents/${activeDoc.id}/assess`, {
        method: "POST",
      });
      if (!response.ok) {
        console.warn("Failed to start assessment");
        setIsInsightsLoading(false);
        setInsightsPollExhausted(true);
      } else {
        setAssessVersion((v) => v + 1);
      }
    } catch (err) {
      console.warn("Failed to start assessment:", err);
      setIsInsightsLoading(false);
      setInsightsPollExhausted(true);
    }
  }, [activeDoc?.id]);

  useEffect(() => {
    const approved = documents.filter((doc) => doc.approved).length;
    const scored = documents.filter((doc) => typeof doc.relevancyScore === "number");
    const averageScore = scored.length
      ? scored.reduce((sum, doc) => sum + doc.relevancyScore, 0) / scored.length
      : 0;
    setBatchStats({
      approvedCount: approved,
      totalCount: documents.length,
      averageScore,
    });
  }, [documents]);


  // ── ARCHITECTURE STEP: Human-in-the-Loop PATCH Toggle ──
  // Fires sequence interaction #3 directly to DocumentApprovalController
  const handleApprovalToggle = async (index) => {
    const docToToggle = documents[index];
    const targetApprovalState = !docToToggle.approved;

    // Optimistically update frontend UI toggle switch state
    const updatedDocs = documents.map((doc, i) =>
      i === index ? { ...doc, approved: targetApprovalState } : doc
    );
    setDocuments(updatedDocs);

    // Always update footer stats locally so UI reflects current state immediately
    setBatchStats((prev) => ({
      ...prev,
      approvedCount: updatedDocs.filter((d) => d.approved).length,
      totalCount: updatedDocs.length,
    }));

    try {
      const response = await fetch(`/api/v1/documents/${docToToggle.id}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Session-Id": sessionId,
        },
        body: JSON.stringify({
          status: targetApprovalState ? "APPROVED" : "READY",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Server responds with recalculations computed by DocumentValidationService
        setBatchStats({
          approvedCount: data.batchStats.approvedCount,
          totalCount: updatedDocs.length,
          averageScore: data.batchStats.averageScore,
        });
      }
      // No rollback — keep optimistic state to avoid jarring UX
    } catch (err) {
      // Backend unavailable — optimistic state is already applied, no rollback
      console.warn("Backend sync skipped (offline):", err.message);
    }
  };

  const handleDeleteDocument = async (index) => {
    const docToDelete = documents[index];
    if (!docToDelete?.id) return;

    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);

    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (index === currentIndex) {
      setCurrentIndex(Math.min(currentIndex, Math.max(0, updatedDocs.length - 1)));
    }

    try {
      const response = await fetch(`/api/v1/documents/${docToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        await fetchDocuments();
      }
    } catch (err) {
      console.warn("Failed to delete document:", err);
      await fetchDocuments();
    }
  };

  const handleUploadNew = () => {
    // Module 1 (WorkspaceImportLayout) not yet wired — stay on current view
    onStepChange(1); 
  };

  const handleProceed = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      onStepChange(2);
    }, 2200);
  };

  // CSS animations for success toast
  const styleInject = (
    <style>{`
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
    `}</style>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Poppins', sans-serif",
        flex: 1,
      }}
    >
      {styleInject}

      {showSuccessToast && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(14, 12, 10, 0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeInToast 0.3s ease-out forwards",
        }}>
          <div style={{
            background: "#1E1C19",
            border: "1px solid rgba(217, 138, 33, 0.25)",
            borderRadius: "24px",
            padding: "2.5rem 3rem",
            maxWidth: "480px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(216, 90, 48, 0.15)",
            animation: "scaleInToast 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(216, 90, 48, 0.1)",
              border: "2px solid #D85A30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              boxShadow: "0 0 20px rgba(216, 90, 48, 0.2)",
              animation: "pulseRing 2s infinite",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D98A21" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50,
                  animation: "drawCheckmark 0.6s ease-out 0.2s forwards",
                }} />
              </svg>
            </div>
            <h3 style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "#f0ece6",
              margin: "0 0 0.5rem 0",
              letterSpacing: "0.01em",
            }}>
              Synthesis Starting
            </h3>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.95rem",
              color: "rgba(240, 236, 230, 0.7)",
              lineHeight: "1.6",
              margin: "0 0 1.75rem 0",
            }}>
              Your validated documents are being synthesized. Preparing the synthesis dashboard.
            </p>
            <div style={{
              width: "100%",
              height: "4px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "2px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(90deg, #D98A21, #D85A30)",
                width: "0%",
                borderRadius: "2px",
                animation: "fillProgress 2.2s linear forwards",
              }} />
            </div>
          </div>
        </div>
      )}

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
        {/* Left Interactive Document Control Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minHeight: 0 }}>
          <DocumentActiveCard
            documents={documents}
            currentIndex={currentIndex}
            onNavigate={(idx) => setCurrentIndex(Math.max(0, Math.min(documents.length - 1, idx)))}
            onApprovalToggle={handleApprovalToggle}
          />
          <QuickNavigationList
            documents={documents}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            onDelete={handleDeleteDocument}
          />
        </div>

        {/* Right Isolated Semantic Metric Viewport */}
        <AIAssessmentPanel
          documentId={activeDoc?.id}
          insights={activeInsights}
          isLoading={isInsightsLoading}
          assessmentTimedOut={insightsPollExhausted}
          onAssess={handleAssessDocument}
          onUploadClick={handleUploadNew}
        />
      </div>

      {/* Real-time server validated aggregates status board footer */}
      <ValidationSummaryFooter
        approvedCount={batchStats.approvedCount}
        totalCount={batchStats.totalCount}
        averageScore={batchStats.averageScore}
        onProceed={handleProceed}
      />
    </div>
  );
}