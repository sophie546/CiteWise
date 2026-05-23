import { useState, useEffect, useCallback, useRef } from "react";
import DocumentActiveCard from "./DocumentActiveCard";
import QuickNavigationList from "./QuickNavigationList";
import AIAssessmentPanel from "../../ai-assessment/components/AIAssessmentPanel";
import ValidationSummaryFooter from "./ValidationSummaryFooter";
import RrlUploadLayout from "../../../module1/rrl-upload/components/RrlUploadLayout";

export default function ValidationDashboardLayout({ sessionId: propSessionId, onStepChange }) {
  const STORAGE_SESSION_KEY = "citewise.session_id";

  // Use sessionId from prop or generate/get from localStorage
  const [resolvedSessionId, setResolvedSessionId] = useState(() => {
    if (propSessionId) return propSessionId;
    const stored = localStorage.getItem(STORAGE_SESSION_KEY);
    if (stored) return stored;
    // Generate new session ID if none exists
    const newSessionId = crypto.randomUUID ? crypto.randomUUID() : 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(STORAGE_SESSION_KEY, newSessionId);
    return newSessionId;
  });

  const [documents, setDocuments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeInsights, setActiveInsights] = useState(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsPollExhausted, setInsightsPollExhausted] = useState(false);
  const [assessVersion, setAssessVersion] = useState(0);
  const pollAttemptsRef = useRef(0);
  const MAX_INSIGHTS_POLL_ATTEMPTS = 50;
  const [batchStats, setBatchStats] = useState({
    approvedCount: 0,
    totalCount: 0,
    averageScore: 0,
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // State for modular Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);

  const activeDoc = documents[currentIndex];

  // Save sessionId to localStorage when it changes
  useEffect(() => {
    if (resolvedSessionId) {
      localStorage.setItem(STORAGE_SESSION_KEY, resolvedSessionId);
    }
  }, [resolvedSessionId]);

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
      // Prefer a backend-provided overallScore if present (ensures weighted score used),
      // otherwise fall back to legacy relevancyScore field.
      const overallFromInsight = item.overallScore ?? (item.insight && item.insight.overallScore) ?? null;
      return {
        id: item.id,
        name: item.fileName || "Untitled.pdf",
        size: formatBytes(item.sizeBytes),
        pages: prev?.pages ?? "-",
        status: mapStatus(item.status),
        approved: prev?.approved ?? false,
        relevancyScore: overallFromInsight ?? item.relevancyScore ?? null,
      };
    });
  };

  const fetchDocuments = useCallback(async () => {
    if (!resolvedSessionId) return;
    try {
      const response = await fetch(`/api/v1/documents/session/${resolvedSessionId}`, {
        headers: {
          'X-Session-Id': resolvedSessionId,
        }
      });
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
          headers: {
            'X-Session-Id': resolvedSessionId,
          }
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
  }, [activeDoc?.id, assessVersion, resolvedSessionId]);

  const handleAssessDocument = useCallback(async () => {
    if (!activeDoc?.id) return;
    setActiveInsights(null);
    setIsInsightsLoading(true);
    setInsightsPollExhausted(false);
    pollAttemptsRef.current = 0;
    try {
      const response = await fetch(`/api/v1/documents/${activeDoc.id}/assess`, {
        method: "POST",
        headers: {
          'X-Session-Id': resolvedSessionId,
        }
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
  }, [activeDoc?.id, resolvedSessionId]);

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

  const handleApprovalToggle = async (index) => {
    const docToToggle = documents[index];
    const targetApprovalState = !docToToggle.approved;

    const updatedDocs = documents.map((doc, i) =>
      i === index ? { ...doc, approved: targetApprovalState } : doc
    );
    setDocuments(updatedDocs);

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
          "X-Session-Id": resolvedSessionId,
        },
        body: JSON.stringify({
          status: targetApprovalState ? "APPROVED" : "READY",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBatchStats({
          approvedCount: data.batchStats.approvedCount,
          totalCount: updatedDocs.length,
          averageScore: data.batchStats.averageScore,
        });
      }
    } catch (err) {
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
        headers: {
          'X-Session-Id': resolvedSessionId,
        }
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
    setShowUploadModal(true);
  };

const handleProceed = () => {
  // Get currently approved documents from current session
  const currentlyApproved = documents.filter(doc => doc.approved === true);
  
  console.log("=== PROCEED TO SYNTHESIS ===");
  console.log("Currently approved in Module 2:", currentlyApproved.map(d => d.name));
  
  const storageKey = `citewise_approved_docs_${resolvedSessionId}`;
  
  // Get existing approved documents from localStorage
  const existingApprovedStr = localStorage.getItem(storageKey);
  let existingApproved = [];
  
  if (existingApprovedStr) {
    try {
      existingApproved = JSON.parse(existingApprovedStr);
      console.log("Existing approved from localStorage:", existingApproved.map(d => d.name || d.fileName));
    } catch (err) {
      console.error("Error parsing existing docs:", err);
    }
  }
  
  // MERGE: Combine existing with newly approved, avoid duplicates by ID and name
  const mergedMap = new Map();
  
  // Add existing documents first
  existingApproved.forEach(doc => {
    const key = doc.id || doc.name || doc.fileName;
    mergedMap.set(key, doc);
  });
  
  // Add/merge newly approved documents
  currentlyApproved.forEach(newDoc => {
    const key = newDoc.id || newDoc.name || newDoc.fileName;
    if (mergedMap.has(key)) {
      console.log("Document already exists, updating:", newDoc.name || newDoc.fileName);
      // Update existing document with latest data
      mergedMap.set(key, { ...mergedMap.get(key), ...newDoc });
    } else {
      console.log("Adding NEW document:", newDoc.name || newDoc.fileName);
      mergedMap.set(key, newDoc);
    }
  });
  
  const mergedApproved = Array.from(mergedMap.values());
  console.log("FINAL MERGED approved documents:", mergedApproved.map(d => d.name || d.fileName));
  console.log("Total approved documents count:", mergedApproved.length);
  
  // Save merged list to localStorage
  localStorage.setItem(storageKey, JSON.stringify(mergedApproved));
  
  // Also save to sessionStorage for redundancy
  sessionStorage.setItem(storageKey, JSON.stringify(mergedApproved));
  
  setShowSuccessToast(true);
  setTimeout(() => {
    onStepChange(2, resolvedSessionId);
  }, 2200);
};

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
      @keyframes slideInToast {
        from { opacity: 0; transform: translateX(50px) scale(0.95); }
        to { opacity: 1; transform: translateX(0) scale(1); }
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

      {showUploadModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(14, 12, 10, 0.8)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeInToast 0.3s ease-out forwards",
          fontFamily: "'Poppins', sans-serif",
        }}>
          <div style={{
            background: "#1E1C19",
            border: "1px solid #3A3630",
            borderRadius: "24px",
            padding: "2rem",
            maxWidth: "900px",
            width: "95%",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
            animation: "scaleInToast 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            fontFamily: "'Poppins', sans-serif",
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#e07b39", margin: 0 }}>
                  Upload New RRL Documents
                </h3>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: "#8a8278", margin: "0.25rem 0 0" }}>
                  Add candidates to the current assessment batch. Duplicates are auto-removed.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8a8278",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f0ece6"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#8a8278"}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Reuse RrlUploadLayout to handle files queue, duplicate warnings, and server submission */}
            <div style={{ overflow: "hidden" }}>
              <RrlUploadLayout 
                sessionId={resolvedSessionId} 
                hideHeader={true}
                onUploadComplete={async () => {
                  await fetchDocuments();
                  setTimeout(() => {
                    setShowUploadModal(false);
                  }, 2000);
                }}
              />
            </div>
          </div>
        </div>
      )}

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

        <AIAssessmentPanel
          documentId={activeDoc?.id}
          insights={activeInsights}
          isLoading={isInsightsLoading}
          assessmentTimedOut={insightsPollExhausted}
          onAssess={handleAssessDocument}
          onUploadClick={handleUploadNew}
        />
      </div>

      <ValidationSummaryFooter
        approvedCount={batchStats.approvedCount}
        totalCount={batchStats.totalCount}
        averageScore={batchStats.averageScore}
        onProceed={handleProceed}
      />
    </div>
  );
}