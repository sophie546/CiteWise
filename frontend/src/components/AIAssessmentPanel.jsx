import React, { useState, useEffect } from 'react';
import SemanticScoreDashboard from './SemanticScoreDashboard';
import EvidenceExcerptList from './EvidenceExcerptList';

const AIAssessmentPanel = ({ documentId, onUploadClick }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAssessing, setIsAssessing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

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
                        // Poll again after 5 seconds if not found
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
        if (!documentId || isAssessing) {
            return;
        }

        setIsAssessing(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/documents/${documentId}/assess`, {
                method: 'POST'
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

    if (!documentId) return (
        <div className="aap-empty">
            <svg className="aap-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Select a document to view AI insights.</p>
        </div>
    );
    
    if (loading) return (
        <div className="aap-panel">
            <div className="aap-header">
                <h2 className="aap-title">AI Assessment Panel</h2>
                <div className="aap-actions">
                    <button
                        type="button"
                        className="aap-assess-btn"
                        onClick={handleAssess}
                        disabled={isAssessing}
                    >
                        {isAssessing ? 'Assessing...' : 'Assess PDF'}
                    </button>
                    {onUploadClick && (
                        <button type="button" className="aap-upload-btn" onClick={onUploadClick}>
                            Upload New PDF
                        </button>
                    )}
                </div>
            </div>
            <div className="aap-loading">
                <div className="aap-spinner" />
                <p>Analyzing document content...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="aap-panel">
            <div className="aap-header">
                <h2 className="aap-title">AI Assessment Panel</h2>
                <div className="aap-actions">
                    <button
                        type="button"
                        className="aap-assess-btn"
                        onClick={handleAssess}
                        disabled={isAssessing}
                    >
                        {isAssessing ? 'Assessing...' : 'Assess PDF'}
                    </button>
                    {onUploadClick && (
                        <button type="button" className="aap-upload-btn" onClick={onUploadClick}>
                            Upload New PDF
                        </button>
                    )}
                </div>
            </div>
            <div className="aap-error">
                <h3>Analysis Error</h3>
                <p>{error}</p>
            </div>
        </div>
    );
    
    if (!insights) return (
        <div className="aap-panel">
            <div className="aap-header">
                <h2 className="aap-title">AI Assessment Panel</h2>
                <div className="aap-actions">
                    <button
                        type="button"
                        className="aap-assess-btn"
                        onClick={handleAssess}
                        disabled={isAssessing}
                    >
                        {isAssessing ? 'Assessing...' : 'Assess PDF'}
                    </button>
                    {onUploadClick && (
                        <button type="button" className="aap-upload-btn" onClick={onUploadClick}>
                            Upload New PDF
                        </button>
                    )}
                </div>
            </div>
            <div className="aap-loading">
                <p>No insights available yet. The document may still be processing.</p>
            </div>
        </div>
    );

    const scores = {
        gapAlignment: insights.gapAlignmentScore || 0,
        methodology: insights.methodologyScore || 0,
        theoretical: insights.theoreticalScore || 0,
        citation: insights.citationScore || 0
    };

    return (
        <div className="aap-panel">
            <div className="aap-header">
                <h2 className="aap-title">AI Assessment Panel</h2>
                <div className="aap-actions">
                    <button
                        type="button"
                        className="aap-assess-btn"
                        onClick={handleAssess}
                        disabled={isAssessing}
                    >
                        {isAssessing ? 'Assessing...' : 'Assess PDF'}
                    </button>
                    {onUploadClick && (
                        <button type="button" className="aap-upload-btn" onClick={onUploadClick}>
                            Upload New PDF
                        </button>
                    )}
                </div>
            </div>
            
            <div className="aap-body">
                <EvidenceExcerptList excerpts={insights.evidenceExcerpts || []} />
                
                <div className="aap-divider" />
                
                <SemanticScoreDashboard scores={scores} />
            </div>
        </div>
    );
};

export default AIAssessmentPanel;
