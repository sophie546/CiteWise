import EvidenceExcerptList from "./EvidenceExcerptList";
import SemanticScoreDashboard from "./SemanticScoreDashboard";
import UploadNewPDFButton from "./UploadNewPDFButton";

export default function AIAssessmentPanel({
  insights = null,
  onUploadNew,
  isLoading = false,
}) {
  const defaultInsights = {
    excerpts: [
      {
        quote:
          "The framework proposed in this study addresses the critical gap in existing methodologies by introducing a novel approach to data synthesis and validation…",
        page: 3,
        relevance: "High",
      },
      {
        quote:
          "Results from the experimental validation indicate significant improvement over baseline approaches (p < 0.01), demonstrating the efficacy of the proposed method…",
        page: 7,
        relevance: "High",
      },
      {
        quote:
          "Cross-validation across three independent datasets confirms the robustness and generalizability of findings, supporting broader application in similar research contexts…",
        page: 11,
        relevance: "Medium",
      },
    ],
    scores: {
      researchGapAlignment: 92,
      methodologicalRelevance: 78,
      theoreticalContribution: 85,
      citationQuality: 88,
    },
  };

  const data = insights || defaultInsights;

  return (
    <div
      style={{
        background: "#1e1e1e",
        border: "1px solid #2e2e2e",
        borderRadius: "12px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "22px",
            fontWeight: "700",
            color: "#e8620a",
            margin: 0,
          }}
        >
          AI Assessment Panel
        </h2>
        <UploadNewPDFButton onClick={onUploadNew} />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "13px",
              color: "#555555",
              letterSpacing: "0.5px",
            }}
          >
            Analyzing document…
          </div>
        </div>
      ) : (
        <>
          {/* Evidence Excerpts */}
          <EvidenceExcerptList excerpts={data.excerpts} />

          {/* Divider */}
          <div
            style={{ borderTop: "1px solid #2a2a2a", margin: "-8px 0" }}
          />

          {/* Semantic Scores */}
          <SemanticScoreDashboard scores={data.scores} />
        </>
      )}
    </div>
  );
}