import { useState, useEffect } from "react";
import DocumentActiveCard from "./DocumentActiveCard";
import QuickNavigationList from "./QuickNavigationList";
import AIAssessmentPanel from "../../ai-assessment/components/AIAssessmentPanel";
import ValidationSummaryFooter from "./ValidationSummaryFooter";

export default function ValidationDashboardLayout({ sessionId, onStepChange }) {
  // Primary list state populated initially from your Module 1 file uploads
  const [documents, setDocuments] = useState([
    { id: "uuid-1", name: "Document_001.pdf", size: "2.4 MB", pages: 15, status: "Ready", approved: true },
    { id: "uuid-2", name: "Document_002.pdf", size: "1.8 MB", pages: 22, status: "Uploading", approved: false },
    { id: "uuid-3", name: "Document_003.pdf", size: "3.1 MB", pages: 30, status: "Ready", approved: false },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeInsights, setActiveInsights] = useState(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Server-driven aggregate metrics tracking DocumentValidationService properties
  const [batchStats, setBatchStats] = useState({
    approvedCount: 1,
    totalCount: 3,
    averageScore: 85.75,
  });

  const activeDoc = documents[currentIndex];

  // ── ARCHITECTURE STEP: Async REST Polling for AI Insights ──
  // Per Sequence Diagram 2.1 & 2.2, we fetch insights once status is 'Ready'
  useEffect(() => {
    if (!activeDoc || !sessionId) return;

    // If document analysis is still processing on backend, poll until 'Ready'
    let pollingInterval = null;
    
    const fetchInsightsData = async () => {
      setIsInsightsLoading(true);
      try {
        const response = await fetch(`/api/v1/documents/${activeDoc.id}/insights`, {
          headers: { "Session-Id": sessionId },
        });
        if (response.ok) {
          const data = await response.json(); // Map array payloads to structure
          setActiveInsights(data);
          clearInterval(pollingInterval);
        }
      } catch (err) {
        console.error("Error fetching AI Insights:", err);
      } finally {
        setIsInsightsLoading(false);
      }
    };

    if (activeDoc.status === "Ready") {
      fetchInsightsData();
    } else {
      setActiveInsights(null); // Clear previous cache while processing
      // Poll every 3 seconds to track background text extraction status updates
      pollingInterval = setInterval(async () => {
        // Checking current background task state via a quick status ping
        const res = await fetch(`/api/v1/documents/${activeDoc.id}/status`, {
          headers: { "Session-Id": sessionId }
        });
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.status === "Ready") {
            setDocuments(prev => prev.map(d => d.id === activeDoc.id ? { ...d, status: "Ready" } : d));
            fetchInsightsData();
          }
        }
      }, 3000);
    }

    return () => clearInterval(pollingInterval);
  }, [currentIndex, activeDoc?.id, activeDoc?.status, sessionId]);


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

  const handleUploadNew = () => {
    // Module 1 (WorkspaceImportLayout) not yet wired — stay on current view
    onStepChange(1);
  };

  const handleProceed = () => {
    // Module 3 (SynthesisDraftLayout) not yet wired — stay on current view
    onStepChange(1); 
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Poppins', sans-serif",
        flex: 1,
      }}
    >
      {/* Main Structural Flex/Grid Row Container */}
      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "24px",
          padding: "24px 32px",
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          minHeight: 0,
        }}
      >
        {/* Left Interactive Document Control Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
          />
        </div>

        {/* Right Isolated Semantic Metric Viewport */}
        <AIAssessmentPanel
          insights={activeInsights}
          isLoading={isInsightsLoading}
          onUploadNew={handleUploadNew}
        />
      </main>

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