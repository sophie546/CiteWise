export default function WorkspaceIDInput({ value, onChange, placeholder = "Input Workspace ID..." }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "#2a2724",
        border: "1px solid #333028",
        borderRadius: "8px",
        color: "#f0ece6",
        fontSize: "0.875rem",
        padding: "0.5rem 0.875rem",
        width: "260px",
        outline: "none",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#e07b39")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#333028")}
    />
  );
}