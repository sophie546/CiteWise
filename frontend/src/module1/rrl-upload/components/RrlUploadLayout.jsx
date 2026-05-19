import { useState, useEffect } from "react";
import DragDropZone from "./DragDropZone";
import SelectedFilesList from "./SelectedFilesList";
import UploadAllButton from "./UploadAllButton";
import UploadStatusBar from "./UploadStatusBar";

const MAX_FILE_MB = 20;
const STORAGE_SESSION_KEY = "citewise.sessionId";

function buildFileKey(file) {
  return `${file.name.toLowerCase()}-${file.size}-${file.lastModified}`;
}

export default function RrlUploadLayout({ sessionId: propSessionId, onUploadComplete }) {
  const [sessionId, setSessionId] = useState(() => propSessionId || localStorage.getItem(STORAGE_SESSION_KEY) || "");
  const [fileQueue, setFileQueue] = useState([]);
  const [uploadState, setUploadState] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("Ready to upload");

  useEffect(() => {
    if (sessionId) localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
  }, [sessionId]);

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
          message = `File exceeds ${MAX_FILE_MB} MB limit`;
        } else if (seenKeys.has(key)) {
          status = "duplicate";
          message = "Duplicate file ignored";
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

  const removeFileItem = (id) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpload = async () => {
    const readyFiles = fileQueue.filter((item) => item.status === "queued");
    if (!sessionId.trim()) {
      setUploadState("error");
      setStatusMessage("Session ID missing. Please import CATalyst data first.");
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
      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: { "Session-Id": sessionId.trim() },
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Upload failed.");
      const results = payload?.data?.results || [];
      const accepted = payload?.data?.acceptedFiles || 0;
      const failed = payload?.data?.failedFiles || 0;
      setUploadState(failed > 0 ? "warning" : "success");
      setStatusMessage(
        failed > 0
          ? `Uploaded ${accepted} file(s), ${failed} need attention.`
          : `Uploaded ${accepted} file(s) successfully.`
      );
      setFileQueue((prev) =>
        prev.map((item) => {
          const match = results.find((r) => r.fileName === item.name);
          if (!match)
            return item.status === "uploading"
              ? { ...item, status: "failed", message: "No response received" }
              : item;
          return { ...item, status: match.success ? "uploaded" : "failed", message: match.message };
        })
      );
      if (onUploadComplete && failed === 0 && accepted > 0) {
        onUploadComplete();
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

  const clearAll = () => {
    setFileQueue([]);
    setUploadState("ready");
    setStatusMessage("Ready to upload");
  };

  const readyCount = fileQueue.filter((i) => i.status === "queued").length;
  const totalCount = fileQueue.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e07b39", margin: 0 }}>RRL document upload</h2>
          <p style={{ fontSize: "0.8rem", color: "#8a8278", margin: "0.25rem 0 0" }}>Upload candidate Review of Related Literature PDFs for parsing.</p>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#8a8278" }}>Workspace session ID</span>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Paste session ID"
            style={{
              background: "#2a2724",
              border: "1px solid #333028",
              borderRadius: "8px",
              color: "#f0ece6",
              padding: "0.5rem 0.875rem",
              fontSize: "0.875rem",
              width: "260px",
            }}
          />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <DragDropZone onFilesAdded={appendFiles} maxFileMB={MAX_FILE_MB} />
        <div style={{ background: "#252220", border: "1px solid #333028", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid #333028", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#e07b39" }}>Selected files</span>
            <span style={{ fontSize: "0.75rem", color: "#8a8278" }}>{totalCount} in queue</span>
          </div>
          <SelectedFilesList files={fileQueue} onRemove={removeFileItem} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center" }}>
        <UploadAllButton onClick={handleUpload} isUploading={uploadState === "uploading"} />
        <UploadStatusBar readyCount={readyCount} totalCount={totalCount} statusMessage={statusMessage} uploadState={uploadState} />
      </div>
    </div>
  );
}