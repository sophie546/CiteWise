import { useState, useEffect } from "react";  // ← ADDED useEffect
import ImportHeaderBar from "./ImportHeaderBar";
import DataDisplayGrid from "./DataDisplayGrid";
import DragDropZone from "../../rrl-upload/components/DragDropZone";
import SelectedFilesList from "../../rrl-upload/components/SelectedFilesList";
import UploadAllButton from "../../rrl-upload/components/UploadAllButton";
import UploadStatusBar from "../../rrl-upload/components/UploadStatusBar";

const MAX_FILE_MB = 20;
const STORAGE_SESSION_KEY = "citewise.sessionId";
const STORAGE_CATALYST_KEY = "citewise.catalystData";

function buildFileKey(file) {
  return `${file.name.toLowerCase()}-${file.size}-${file.lastModified}`;
}

export default function WorkspaceImportLayout({ onImportSuccess, onProceed }) {
  // ── CATalyst Import State ──────────────────────────────────────
  const [workspaceId, setWorkspaceId] = useState("");
  const [catalystData, setCatalystData] = useState(() => {
    const stored = localStorage.getItem(STORAGE_CATALYST_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (err) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAttempted, setHasAttempted] = useState(false);

  // ── RRL Upload State ───────────────────────────────────────────
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem(STORAGE_SESSION_KEY) || ""
  );
  const [fileQueue, setFileQueue] = useState([]);
  const [uploadState, setUploadState] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("Ready to upload");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // ✅ ADD THIS useEffect - Restores session on page refresh
  useEffect(() => {
    const savedSessionId = localStorage.getItem(STORAGE_SESSION_KEY);
    const savedCatalystData = localStorage.getItem(STORAGE_CATALYST_KEY);
    
    if (savedSessionId && !sessionId) {
      setSessionId(savedSessionId);
      console.log("✅ Restored session ID:", savedSessionId);
    }
    
    if (savedCatalystData && !catalystData) {
      try {
        setCatalystData(JSON.parse(savedCatalystData));
        console.log("✅ Restored catalyst data");
      } catch (err) {
        console.error("Failed to restore catalyst data:", err);
      }
    }
  }, []); // Runs once on component mount

  const handleImport = async () => {
    const trimmed = workspaceId.trim();
    if (!trimmed) {
      setError("Workspace ID is required.");
      return;
    }
    
    // ✅ CHECK: Do we already have a session ID?
    const existingSessionId = localStorage.getItem(STORAGE_SESSION_KEY);
    if (existingSessionId) {
      console.log("✅ Using existing session ID:", existingSessionId);
      console.log("   Not creating a new one!");
      
      // Just refresh the catalyst data, don't create new session
      try {
        const response = await fetch(`/api/catalyst/${encodeURIComponent(trimmed)}`);
        const payload = await response.json();
        if (payload?.success) {
          const catalystData = {
            title: payload.data?.title,
            rationale: payload.data?.rationale,
            gaps: payload.data?.gaps
          };
          setCatalystData(catalystData);
          localStorage.setItem(STORAGE_CATALYST_KEY, JSON.stringify(catalystData));
        }
      } catch (err) {
        setError(err.message);
      }
      setIsLoading(false);
      return;
    }
    
    // Only create NEW session if NO existing session
    setHasAttempted(true);
    setError("");
    setCatalystData(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/catalyst/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: trimmed })
      });
      
      const payload = await response.json();
      
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to import CATalyst workspace.");
      }
      
      const catalystResponseData = {
        title: payload.data?.title,
        rationale: payload.data?.rationale,
        gaps: payload.data?.gaps
      };
      
      setCatalystData(catalystResponseData);
      localStorage.setItem(STORAGE_CATALYST_KEY, JSON.stringify(catalystResponseData));
      
      const newSessionId = payload.data?.sessionId;
      if (newSessionId) {
        localStorage.setItem(STORAGE_SESSION_KEY, newSessionId);
        setSessionId(newSessionId);
        onImportSuccess?.(newSessionId);
        console.log("✅ New session created:", newSessionId);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  // ── RRL Upload ─────────────────────────────────────────────────
  const appendFiles = (incomingFiles) => {
    if (!incomingFiles?.length) return;
    setUploadState("ready");
    setStatusMessage("Ready to upload");
    setFileQueue((prev) => {
      const next = [...prev];
      const seenKeys = new Set(prev.map((i) => i.key));
      Array.from(incomingFiles).forEach((file) => {
        const key = buildFileKey(file);
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        let status = "queued";
        let message = "Ready for upload";
        if (!isPdf) {
          status = "invalid";
          message = "Unsupported file type";
        } else if (file.size > MAX_FILE_MB * 1024 * 1024) {
          status = "invalid";
          message = `Exceeds ${MAX_FILE_MB}MB`;
        } else if (seenKeys.has(key)) {
          status = "duplicate";
          message = "Duplicate";
        }
        if (!seenKeys.has(key)) seenKeys.add(key);
        next.push({
          id: `${key}-${Math.random().toString(16).slice(2)}`,
          key,
          file,
          name: file.name,
          size: file.size,
          status,
          message,
        });
      });
      return next;
    });
  };

  const removeFileItem = (id) => setFileQueue((prev) => prev.filter((item) => item.id !== id));

  const handleUpload = async () => {
    const readyFiles = fileQueue.filter((item) => item.status === "queued");
    if (!sessionId.trim()) {
      setUploadState("error");
      setStatusMessage("Import CATalyst data first to get a session ID.");
      return;
    }
    if (!readyFiles.length) {
      setUploadState("error");
      setStatusMessage("Add at least one valid PDF before uploading.");
      return;
    }
    setUploadState("uploading");
    setStatusMessage("Uploading...");
    setFileQueue((prev) =>
      prev.map((item) =>
        item.status === "queued" ? { ...item, status: "uploading", message: "Uploading..." } : item
      )
    );
    const formData = new FormData();
    readyFiles.forEach((item) => formData.append("files", item.file));
    try {
      const response = await fetch("/api/rrl/upload", {
        method: "POST",
        headers: { "X-Session-Id": sessionId.trim() },
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Upload failed.");
      const results = payload?.data?.results || [];
      const accepted = payload?.data?.acceptedFiles || 0;
      const failed = payload?.data?.failedFiles || 0;
      setUploadState(failed > 0 ? "warning" : "success");
      setStatusMessage(
        failed > 0 ? `${accepted} uploaded, ${failed} failed.` : `${accepted} file(s) uploaded.`
      );
      setFileQueue((prev) =>
        prev.map((item) => {
          const match = results.find((r) => r.fileName === item.name);
          if (!match) return item.status === "uploading" ? { ...item, status: "failed", message: "No response" } : item;
          return { ...item, status: match.success ? "uploaded" : "failed", message: match.message };
        })
      );
      // Proceed automatically if upload succeeded fully
      if (failed === 0 && accepted > 0) {
        setShowSuccessToast(true);
        setTimeout(() => {
          onProceed?.();
        }, 2200);
      }
    } catch (err) {
      setUploadState("error");
      setStatusMessage(err.message);
      setFileQueue((prev) =>
        prev.map((item) =>
          item.status === "uploading" ? { ...item, status: "failed", message: "Network error" } : item
        )
      );
    }
  };

  const resetSession = () => {
    if (confirm("⚠️ This will clear all your uploaded documents and session data. Are you sure?")) {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      localStorage.removeItem(STORAGE_CATALYST_KEY);
      setSessionId("");
      setCatalystData(null);
      setFileQueue([]);
      window.location.reload();
    }
  };

  const readyCount = fileQueue.filter((i) => i.status === "queued").length;
  const totalCount = fileQueue.length;

  return (
    <div style={{ maxWidth: 1280, width: "100%", margin: "0 auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
              Upload Complete
            </h3>

            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.95rem",
              color: "rgba(240, 236, 230, 0.7)",
              lineHeight: "1.6",
              margin: "0 0 1.75rem 0",
            }}>
              Your research literature has been successfully synchronized. Preparing the validation dashboard.
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

      {/* ── Card 1: CATalyst Data Import ─────────────────────────── */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={cardTitle}>CATalyst Data Import</span>
          <ImportHeaderBar
            workspaceId={workspaceId}
            onWorkspaceIdChange={setWorkspaceId}
            onImport={handleImport}
            isLoading={isLoading}
          />
        </div>

        <DataDisplayGrid
          catalystData={catalystData}
          isLoading={isLoading}
          error={error}
          hasAttempted={hasAttempted}
        />
      </div>

      {/* ── Card 2: RRL Document Upload ──────────────────────────── */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={cardTitle}>RRL Document Upload</span>
          {/* ✅ ADD RESET BUTTON HERE */}
          <button
            onClick={resetSession}
            style={{
              background: "transparent",
              border: "1px solid #e05555",
              borderRadius: "6px",
              color: "#e05555",
              padding: "6px 12px",
              fontSize: "0.7rem",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(224, 85, 85, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Reset Session
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            padding: "1.25rem 1.5rem",
          }}
        >
          <DragDropZone onFilesAdded={appendFiles} maxFileMB={MAX_FILE_MB} />

          <div
            style={{
              background: "rgba(0, 0, 0, 0.15)",
              border: "1px solid #3A3630",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              minHeight: 200,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={selectedLabel}>Selected Files</span>
              {totalCount > 0 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(240, 236, 230, 0.4)",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {totalCount} in queue
                </span>
              )}
            </div>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.15)",
                borderRadius: "8px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <SelectedFilesList files={fileQueue} onRemove={removeFileItem} />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            padding: "0 1.5rem 1.25rem",
            alignItems: "center",
          }}
        >
          <UploadAllButton onClick={handleUpload} isUploading={uploadState === "uploading"} />
          <UploadStatusBar
            readyCount={readyCount}
            totalCount={totalCount}
            statusMessage={statusMessage}
            uploadState={uploadState}
          />
        </div>
      </div>
    </div>
  );
}

// Style injection
const styleInject = (
  <style dangerouslySetInnerHTML={{
    __html: `
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInToast {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleInToast {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes drawCheckmark {
      to { stroke-dashoffset: 0; }
    }
    @keyframes pulseRing {
      0% { box-shadow: 0 0 0 0 rgba(216, 90, 48, 0.4); }
      70% { box-shadow: 0 0 0 12px rgba(216, 90, 48, 0); }
      100% { box-shadow: 0 0 0 0 rgba(216, 90, 48, 0); }
    }
    @keyframes fillProgress {
      from { width: 0%; }
      to { width: 100%; }
    }
  `}} />
);

// ── Shared style tokens ──────────────────────────────────────────
const card = {
  background: "#1E1C19",
  border: "1px solid #3A3630",
  borderRadius: "16px",
  overflow: "hidden",
  animation: "cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
};

const cardHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1.125rem 1.5rem",
  borderBottom: "1px solid #3A3630",
  gap: "1rem",
  background: "rgba(0, 0, 0, 0.15)",
};

const cardTitle = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 700,
  fontSize: "1.05rem",
  color: "#D98A21",
  letterSpacing: "0.01em",
  flexShrink: 0,
};

const selectedLabel = {
  fontSize: "0.75rem",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#D98A21",
  fontFamily: "'Poppins', sans-serif",
};