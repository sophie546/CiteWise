// module3/synthesis-draft/components/SuccessToast.jsx
import { useEffect } from "react";

export default function SuccessToast({ show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2200);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.toast}>
        <div style={styles.iconContainer}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D98A21" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" style={styles.checkmark} />
          </svg>
        </div>
        <h3 style={styles.title}>Synthesis Complete</h3>
        <p style={styles.message}>
          Your literature synthesis introduction has been generated with APA citations.
        </p>
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(14, 12, 10, 0.75)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeInToast 0.3s ease-out forwards",
  },
  toast: {
    background: "#1E1C19",
    border: "1px solid rgba(217, 138, 33, 0.25)",
    borderRadius: "24px",
    padding: "2.5rem 3rem",
    maxWidth: "480px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(216, 90, 48, 0.15)",
    animation: "scaleInToast 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
  },
  iconContainer: {
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
  },
  checkmark: {
    strokeDasharray: 50,
    strokeDashoffset: 50,
    animation: "drawCheckmark 0.6s ease-out 0.2s forwards",
  },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: "1.5rem",
    color: "#f0ece6",
    margin: "0 0 0.5rem 0",
    letterSpacing: "0.01em",
  },
  message: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.95rem",
    color: "rgba(240, 236, 230, 0.7)",
    lineHeight: "1.6",
    margin: "0 0 1.75rem 0",
  },
  progressBarContainer: {
    width: "100%",
    height: "4px",
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #D98A21, #D85A30)",
    width: "0%",
    borderRadius: "2px",
    animation: "fillProgress 2.2s linear forwards",
  },
};