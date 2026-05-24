import { useEffect, useMemo, useState } from "react";

/**
 * DataDisplayGrid
 * Renders CATalyst Research Title, Rationale, and Research Gap data.
 */
function normalizeGaps(value) {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value
      .map((gap) => {
        if (typeof gap === "string") return gap.trim();
        if (gap && typeof gap === "object") {
          return String(
            gap.gap ??
              gap.researchGap ??
              gap.research_gap ??
              gap.description ??
              gap.statement ??
              gap.text ??
              ""
          ).trim();
        }
        return String(gap ?? "").trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return normalizeGaps(
      value.gaps ?? value.gap ?? value.researchGaps ?? value.research_gap ?? value.researchGap
    );
  }

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const parsedGaps = normalizeGaps(parsed);
    if (parsedGaps.length) return parsedGaps;
  } catch {
    // Plain text gap strings are valid CATalyst input too.
  }

  return raw
    .split(/\r?\n+/)
    .map((gap) => gap.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function getChosenGapStorageKey(sessionId) {
  return sessionId ? `citewise_chosen_gap_${sessionId}` : "citewise_chosen_gap_default";
}

function saveChosenGap(sessionId, gapIndex, gapText) {
  localStorage.setItem(
    getChosenGapStorageKey(sessionId),
    JSON.stringify({
      gapIndex,
      gapText,
      selectedAt: new Date().toISOString(),
    })
  );
}

function loadChosenGap(sessionId) {
  const stored = localStorage.getItem(getChosenGapStorageKey(sessionId));
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export default function DataDisplayGrid({ catalystData, isLoading, error, sessionId }) {
  const gaps = useMemo(() => normalizeGaps(catalystData?.gaps), [catalystData?.gaps]);
  const storageKey = getChosenGapStorageKey(sessionId);
  const [selectedGap, setSelectedGap] = useState(null);
  const [isChangingGap, setIsChangingGap] = useState(false);

  useEffect(() => {
    if (gaps.length === 1) {
      saveChosenGap(sessionId, 0, gaps[0]);
    }
  }, [gaps, sessionId]);

  const selectedGapIndex = useMemo(() => {
    if (isLoading || gaps.length === 0) return null;
    if (selectedGap?.storageKey === storageKey && gaps[selectedGap.gapIndex] === selectedGap.gapText) {
      return selectedGap.gapIndex;
    }
    if (gaps.length === 1) return 0;
    const stored = loadChosenGap(sessionId);
    const restoredIndex = gaps.findIndex((gap, index) => {
      return gap === stored?.gapText && index === stored?.gapIndex;
    });
    const fallbackIndex = gaps.findIndex((gap) => gap === stored?.gapText);
    const nextIndex = restoredIndex >= 0 ? restoredIndex : fallbackIndex;
    return nextIndex >= 0 ? nextIndex : null;
  }, [gaps, isLoading, selectedGap, sessionId, storageKey]);

  const handleGapSelect = (gapIndex, gapText) => {
    setSelectedGap({ gapIndex, gapText, storageKey });
    setIsChangingGap(false);
    saveChosenGap(sessionId, gapIndex, gapText);
  };

  if (error) {
    return (
      <div
        style={{
          margin: "1.25rem",
          background: "rgba(216, 90, 48, 0.08)",
          border: "1px solid rgba(216, 90, 48, 0.25)",
          borderRadius: "8px",
          color: "#D85A30",
          fontSize: "0.875rem",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          padding: "0.75rem 1rem",
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.25rem 1.5rem",
      }}
    >
      <DataColumn
        label="Research Title"
        value={catalystData?.title}
        isLoading={isLoading}
        isTitleRow
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <DataColumn
          label="Rationale"
          value={catalystData?.rationale}
          isLoading={isLoading}
        />
        <DataColumn
          label="Research Gap"
          value={gaps}
          isLoading={isLoading}
          isList
          selectedGapIndex={selectedGapIndex}
          onGapSelect={handleGapSelect}
          isChangingGap={isChangingGap}
          onChangeGap={() => setIsChangingGap(true)}
        />
      </div>
    </div>
  );
}

function DataColumn({
  label,
  value,
  isLoading,
  isList,
  isTitleRow,
  selectedGapIndex,
  onGapSelect,
  isChangingGap,
  onChangeGap,
}) {
  const hasListValue = isList && Array.isArray(value) && value.length > 0;
  const hasPlainValue = !isList && value;

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.15)",
        border: "1px solid #3A3630",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minHeight: isTitleRow ? "120px" : "240px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#D98A21";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(217, 138, 33, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#3A3630";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          letterSpacing: "0.08em",
          color: "#D98A21",
          textTransform: "uppercase",
          fontFamily: "'Poppins', sans-serif",
          margin: 0,
        }}
      >
        {label}
      </p>

      <div
        style={{
          background: "none",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflowY: "auto",
        }}
      >
        {isLoading ? (
          <p style={placeholderText(isTitleRow)}>Loading...</p>
        ) : hasListValue ? (
          <PrimaryGapSelector
            gaps={value}
            selectedGapIndex={selectedGapIndex}
            onGapSelect={onGapSelect}
            isChangingGap={isChangingGap}
            onChangeGap={onChangeGap}
          />
        ) : hasPlainValue ? (
          <p
            style={{
              fontSize: isTitleRow ? "1.15rem" : "0.85rem",
              fontWeight: isTitleRow ? "600" : "400",
              color: "#f0ece6",
              lineHeight: isTitleRow ? 1.45 : 1.65,
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {value}
          </p>
        ) : (
          <p style={placeholderText(isTitleRow)}>[Awaiting Import]</p>
        )}
      </div>
    </div>
  );
}

function PrimaryGapSelector({ gaps, selectedGapIndex, onGapSelect, isChangingGap, onChangeGap }) {
  const selectedGapText = selectedGapIndex != null ? gaps[selectedGapIndex] : "";
  const shouldShowChooser = gaps.length > 1 && (selectedGapIndex == null || isChangingGap);

  if (selectedGapText && !shouldShowChooser) {
    return (
      <SelectedGapDisplay
        gapText={selectedGapText}
        canChange={gaps.length > 1}
        onChangeGap={onChangeGap}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {gaps.length > 1 && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "rgba(240, 236, 230, 0.72)",
            lineHeight: 1.5,
            margin: 0,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Choose one research gap for this literature review.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {gaps.map((gap, idx) => {
          return (
            <button
              key={`${idx}-${gap}`}
              type="button"
              onClick={() => onGapSelect?.(idx, gap)}
              style={{
                appearance: "none",
                width: "100%",
                textAlign: "left",
                background: "rgba(0, 0, 0, 0.18)",
                border: "1px solid rgba(240, 236, 230, 0.12)",
                borderRadius: "10px",
                color: "#f0ece6",
                cursor: "pointer",
                padding: "0.85rem",
                boxShadow: "none",
                transition:
                  "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#D98A21";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(240, 236, 230, 0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ display: "block", fontSize: "0.84rem", lineHeight: 1.55 }}>
                {gap}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}

function SelectedGapDisplay({ gapText, canChange, onChangeGap }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          background: "rgba(217, 138, 33, 0.1)",
          border: "1px solid #D98A21",
          borderRadius: "10px",
          boxShadow: "0 0 0 1px rgba(217, 138, 33, 0.14), 0 10px 24px rgba(217, 138, 33, 0.06)",
          color: "#f0ece6",
          padding: "0.9rem",
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.86rem",
          lineHeight: 1.6,
        }}
      >
        {gapText}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(240, 236, 230, 0.55)",
            lineHeight: 1.45,
            margin: 0,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          This selected gap is saved locally in your browser.
        </p>
        {canChange && (
          <button
            type="button"
            onClick={onChangeGap}
            style={{
              background: "transparent",
              border: "none",
              color: "#D98A21",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.74rem",
              fontWeight: 700,
              padding: "0.2rem 0",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Change selected gap
          </button>
        )}
      </div>
    </div>
  );
}

function placeholderText(isTitleRow) {
  return {
    fontSize: isTitleRow ? "1.05rem" : "0.85rem",
    color: "rgba(240, 236, 230, 0.4)",
    fontStyle: "italic",
    margin: 0,
    fontFamily: "'Poppins', sans-serif",
  };
}
