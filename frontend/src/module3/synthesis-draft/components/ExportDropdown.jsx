// module3/synthesis-draft/components/ExportDropdown.jsx
import { useEffect, useRef } from "react";

export default function ExportDropdown({ isOpen, onExport, onCopy }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Dropdown will be closed by parent
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} style={styles.dropdown}>
      <button onClick={() => onExport("PDF")} style={styles.dropdownItem}>
        Export as PDF (.pdf)
      </button>
      <button onClick={() => onExport("DOCX")} style={styles.dropdownItem}>
        Export as Word (.docx)
      </button>
      <button onClick={() => onExport("TXT")} style={styles.dropdownItem}>
        Export as Plain Text (.txt)
      </button>
      <div style={styles.divider} />
      <button onClick={onCopy} style={{ ...styles.dropdownItem, ...styles.copyButton }}>
        Copy to Clipboard
      </button>
    </div>
  );
}

const styles = {
  dropdown: {
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
  },
  dropdownItem: {
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
  },
  divider: {
    height: "1px",
    background: "#333028",
  },
  copyButton: {
    color: "#e07b39",
  },
};