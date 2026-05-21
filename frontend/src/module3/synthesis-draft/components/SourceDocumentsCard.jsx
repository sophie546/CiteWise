// module3/synthesis-draft/components/SourceDocumentsCard.jsx
const fallbackDocs = [
  { name: "Document_001.pdf" },
  { name: "Document_002.pdf" },
  { name: "Document_003.pdf" },
];

export default function SourceDocumentsCard({ documents = fallbackDocs }) {
  return (
    <div style={styles.card}>
      <span style={styles.title}>Source Documents</span>
      <div style={styles.divider} />
      <div style={styles.documentList}>
        {documents.map((doc, idx) => (
          <div key={idx} style={styles.documentItem}>
            <span style={styles.documentName} title={doc.name}>
              {doc.name}
            </span>
            <div style={styles.checkIndicator}>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="#f0ece6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#1E1C19",
    border: "1px solid #3A3630",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#D98A21",
    letterSpacing: "0.01em",
  },
  divider: {
    height: "1px",
    background: "#3A3630",
  },
  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  documentItem: {
    background: "rgba(0, 0, 0, 0.15)",
    border: "1px solid #3A3630",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "border-color 0.2s ease",
  },
  documentName: {
    fontSize: "0.85rem",
    color: "#f0ece6",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "220px",
  },
  checkIndicator: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#D85A30",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};