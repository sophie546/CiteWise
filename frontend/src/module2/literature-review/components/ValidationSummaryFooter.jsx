export default function ValidationSummaryFooter({
    approvedCount = 0,
    totalCount = 0,
    averageScore = 0,
    onProceed,
}) {
    const canProceed = approvedCount > 0;

    return (
        <footer
            style={{
                background: "#1a1a1a",
                borderTop: "1px solid #2e2e2e",
                padding: "0 32px",
                height: "72px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                bottom: 0,
                zIndex: 100,
                gap: "24px",
            }}
        >
            {/* Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                {/* Approved Documents */}
                <div
                    style={{
                        paddingRight: "32px",
                        borderRight: "1px solid #2e2e2e",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#ffffff",
                            lineHeight: 1.1,
                        }}
                    >
                        {approvedCount} / {totalCount}
                    </div>
                    <div
                        style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "10px",
                            color: "#e8620a",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            marginTop: "3px",
                        }}
                    >
                        Approved Documents
                    </div>
                </div>

                {/* Average Score */}
                <div style={{ paddingLeft: "32px" }}>
                    <div
                        style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#ffffff",
                            lineHeight: 1.1,
                        }}
                    >
                        {averageScore.toFixed(2)}%
                    </div>
                    <div
                        style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "10px",
                            color: "#e8620a",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            marginTop: "3px",
                        }}
                    >
                        Average Score
                    </div>
                </div>
            </div>

            {/* Proceed Button */}
            <button
                onClick={canProceed ? onProceed : undefined}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: canProceed ? "#e8620a" : "#2a2a2a",
                    border: "none",
                    borderRadius: "10px",
                    padding: "14px 28px",
                    cursor: canProceed ? "pointer" : "not-allowed",
                    transition: "background 0.2s ease, transform 0.1s ease",
                    opacity: canProceed ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                    if (canProceed) e.currentTarget.style.background = "#d4570a";
                }}
                onMouseLeave={(e) => {
                    if (canProceed) e.currentTarget.style.background = "#e8620a";
                }}
                onMouseDown={(e) => {
                    if (canProceed) e.currentTarget.style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                    if (canProceed) e.currentTarget.style.transform = "scale(1)";
                }}
            >
                {/* Arrow icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                        d="M3 9H15M15 9L10.5 4.5M15 9L10.5 13.5"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span
                    style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.2px",
                    }}
                >
                    Proceed to Synthesis
                </span>
            </button>
        </footer>
    );
}