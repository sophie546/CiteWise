import React, { useState, useEffect } from 'react';
import EvidenceExcerptList from './EvidenceExcerptList';
import SemanticScoreDashboard from './SemanticScoreDashboard';
import UploadNewPDFButton from './UploadNewPDFButton';

const AIAssessmentPanel = ({ documentId, onUploadClick }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Polling / fetch logic (identical to first file)
  useEffect(() => {
    if (!documentId) return;

    let pollTimeout = null;
    let isMounted = true;

    const fetchInsights = async () => {
      if (isMounted && !pollTimeout) setLoading(true);
      try {
        const response = await fetch(`/api/v1/documents/${documentId}/insights`);

        if (response.status === 404) {
          if (isMounted) {
            setInsights(null);
            setError(null);
            setLoading(true);
            pollTimeout = setTimeout(fetchInsights, 5000);
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch document insights');
        }

        const data = await response.json();
        if (isMounted) {
          setInsights(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchInsights();

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [documentId, refreshKey]);

  const handleAssess = async () => {
    if (!documentId || isAssessing) return;

    setIsAssessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/documents/${documentId}/assess`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start assessment');
      }

      setInsights(null);
      setLoading(true);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAssessing(false);
    }
  };

  // Helper to map API data to the format expected by the new child components
  const getMappedData = () => {
    if (!insights) return null;
    return {
      excerpts: (insights.evidenceExcerpts || []).map((excerpt) => ({
        quote: excerpt.quote || '',
        page: excerpt.page || 0,
        relevance: excerpt.relevance || 'Medium',
      })),
      scores: {
        researchGapAlignment: insights.gapAlignmentScore || 0,
        methodologicalRelevance: insights.methodologyScore || 0,
        theoreticalContribution: insights.theoreticalScore || 0,
        citationQuality: insights.citationScore || 0,
      },
    };
  };

  const mappedData = getMappedData();

  // --- Helper: Panel header with both buttons ---
  const PanelHeader = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <h2
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '22px',
          fontWeight: '700',
          color: '#e07b39',
          margin: 0,
        }}
      >
        AI Assessment Panel
      </h2>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={handleAssess}
          disabled={isAssessing}
          style={{
            background: 'transparent',
            border: '1px solid #e07b39',
            borderRadius: '20px',
            padding: '6px 16px',
            fontFamily: "'Geist Mono', monospace",
            fontSize: '12px',
            fontWeight: 500,
            color: '#e07b39',
            cursor: isAssessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isAssessing) e.currentTarget.style.background = 'rgba(224,123,57,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {isAssessing ? 'Assessing...' : 'Assess PDF'}
        </button>
        <UploadNewPDFButton onClick={onUploadClick} />
      </div>
    </div>
  );

  // --- Empty state (no document selected) ---
  if (!documentId) {
    return (
      <div
        style={{
          background: '#201d1a',
          border: '1px solid #2e2e2e',
          borderRadius: '12px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <PanelHeader />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8a8278"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '13px',
              color: '#8a8278',
              margin: 0,
            }}
          >
            Select a document to view AI insights.
          </p>
        </div>
      </div>
    );
  }

  // --- Loading state (initial fetch or refetch after assess) ---
  if (loading || isAssessing) {
    return (
      <div
        style={{
          background: '#201d1a',
          border: '1px solid #2e2e2e',
          borderRadius: '12px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <PanelHeader />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '13px',
              color: '#8a8278',
              letterSpacing: '0.5px',
            }}
          >
            {isAssessing ? 'Starting assessment...' : 'Analyzing document content...'}
          </div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div
        style={{
          background: '#201d1a',
          border: '1px solid #2e2e2e',
          borderRadius: '12px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <PanelHeader />
        <div
          style={{
            background: '#201d1a',
            border: '1px solid #5a2a2a',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '16px',
              color: '#e07b39',
              margin: '0 0 8px 0',
            }}
          >
            Analysis Error
          </h3>
          <p
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '13px',
              color: '#f0ece6',
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  // --- No insights available (e.g., still processing) ---
  if (!insights || !mappedData) {
    return (
      <div
        style={{
          background: '#201d1a',
          border: '1px solid #2e2e2e',
          borderRadius: '12px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <PanelHeader />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '13px',
              color: '#8a8278',
            }}
          >
            No insights available yet. The document may still be processing.
          </p>
        </div>
      </div>
    );
  }

  // --- Success state: show excerpts and scores using layout from file 2 ---
  return (
    <div
      style={{
        background: '#201d1a',
        border: '1px solid #2e2e2e',
        borderRadius: '12px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <PanelHeader />
      <EvidenceExcerptList excerpts={mappedData.excerpts} />
      <div style={{ borderTop: '1px solid #2a2a2a', margin: '-8px 0' }} />
      <SemanticScoreDashboard scores={mappedData.scores} />
    </div>
  );
};

export default AIAssessmentPanel;