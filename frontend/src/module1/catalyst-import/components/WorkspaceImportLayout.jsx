import { useState } from "react";
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

  // ── CATalyst Import ────────────────────────────────────────────
  const handleImport = async () => {
    const trimmed = workspaceId.trim();
    if (!trimmed) { setError("Workspace ID is required."); return; }
    setHasAttempted(true);
    setError("");
    setCatalystData(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/catalyst/${encodeURIComponent(trimmed)}`);
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to load CATalyst data.");
      }
      setCatalystData(payload.data);
      localStorage.setItem(STORAGE_CATALYST_KEY, JSON.stringify(payload.data));
      const sid = payload.sessionId || trimmed;
      localStorage.setItem(STORAGE_SESSION_KEY, sid);
      setSessionId(sid);
      onImportSuccess?.(sid);
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
        if (!isPdf) { status = "invalid"; message = "Unsupported file type"; }
        else if (file.size > MAX_FILE_MB * 1024 * 1024) { status = "invalid"; message = `Exceeds ${MAX_FILE_MB}MB`; }
        else if (seenKeys.has(key)) { status = "duplicate"; message = "Duplicate"; }
        if (!seenKeys.has(key)) seenKeys.add(key);
        next.push({
          id: `${key}-${Math.random().toString(16).slice(2)}`,
          key, file, name: file.name, size: file.size, status, message,
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

  const readyCount = fileQueue.filter((i) => i.status === "queued").length;
  const totalCount = fileQueue.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Card 1: CATalyst Data Import ─────────────────────────── */}
      <div style={card}>

        {/* Card header row: title left, input+button right */}
        <div style={cardHeader}>
          <span style={cardTitle}>CATalyst Data Import</span>
          <ImportHeaderBar
            workspaceId={workspaceId}
            onWorkspaceIdChange={setWorkspaceId}
            onImport={handleImport}
            isLoading={isLoading}
          />
        </div>

        {/* Data columns – 3-up grid with inner cards */}
        <DataDisplayGrid
          catalystData={catalystData}
          isLoading={isLoading}
          error={error}
          hasAttempted={hasAttempted}
        />

      </div>

      {/* ── Card 2: RRL Document Upload ──────────────────────────── */}
      <div style={card}>

        <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid #333028" }}>
          <span style={cardTitle}>RRL Document Upload</span>
        </div>

        {/* Drop zone + file list side by side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
        }}>
          <DragDropZone onFilesAdded={appendFiles} maxFileMB={MAX_FILE_MB} />

          {/* Selected Files panel */}
          <div style={{
            background: "#252220",
            border: "1px solid #333028",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 200,
          }}>
            <div style={{
              padding: "0.625rem 0.875rem",
              borderBottom: "1px solid #333028",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={selectedLabel}>Selected Files</span>
              {totalCount > 0 && (
                <span style={{ fontSize: "0.7rem", color: "#8a8278" }}>
                  {totalCount} in queue
                </span>
              )}
            </div>
            <SelectedFilesList files={fileQueue} onRemove={removeFileItem} />
          </div>
        </div>

        {/* Upload button + status bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          padding: "0 1.5rem 1.25rem",
          alignItems: "center",
        }}>
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

// ── Shared style tokens ──────────────────────────────────────────
const card = {
  background: "#201d1a",
  border: "1px solid #333028",
  borderRadius: "12px",
  overflow: "hidden",
};

const cardHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1.125rem 1.5rem",
  borderBottom: "1px solid #333028",
  gap: "1rem",
};

const cardTitle = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 700,
  fontSize: "1.05rem",
  fontWeight: "700",
  color: "#e07b39",
  letterSpacing: "0.01em",
  flexShrink: 0,
};

const selectedLabel = {
  fontSize: "0.7rem",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#e07b39",
};