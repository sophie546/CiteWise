import { useRef, useState } from "react";

function CloudUploadIcon() {
  return (
    <svg style={{ width: "48px", height: "48px", color: "#8a8278", marginBottom: "0.25rem" }} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M34 32a10 10 0 0 0-2-19.8A14 14 0 1 0 10 26" />
      <polyline points="24 20 24 36" />
      <polyline points="18 26 24 20 30 26" />
    </svg>
  );
}

export default function DragDropZone({ onFilesAdded, maxFileMB = 20 }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    onFilesAdded(e.dataTransfer.files);
  };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleBrowse = () => fileInputRef.current?.click();
  const handleFileSelect = (e) => onFilesAdded(e.target.files);

  return (
    <div
      style={{
        border: `1.5px dashed ${isDragging ? "#e07b39" : "#333028"}`,
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "2rem 1rem",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        minHeight: "180px",
        textAlign: "center",
        background: isDragging ? "rgba(224, 123, 57, 0.06)" : "transparent",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowse}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <CloudUploadIcon />
      <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#f0ece6" }}>Drop PDF files here</p>
      <small style={{ fontSize: "0.75rem", color: "#8a8278" }}>Multiple files supported</small>
      <button
        type="button"
        style={{
          background: "transparent",
          border: "1.5px solid #e07b39",
          borderRadius: "8px",
          color: "#f0ece6",
          fontSize: "0.875rem",
          fontWeight: 600,
          padding: "0.4rem 1.25rem",
          cursor: "pointer",
          marginTop: "0.25rem",
          transition: "background 0.15s",
        }}
        onClick={(e) => { e.stopPropagation(); handleBrowse(); }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(224, 123, 57, 0.1)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        Or Browse
      </button>
    </div>
  );
}