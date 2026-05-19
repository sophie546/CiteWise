import React from 'react';

const EvidenceExcerptList = ({ excerpts }) => {
    if (!excerpts || excerpts.length === 0) {
        return (
            <div className="eel-empty">
                <span className="eel-empty-icon">📋</span>
                <h4>No Evidence Extracted</h4>
                <p>The AI couldn't identify specific excerpts matching the alignment criteria.</p>
            </div>
        );
    }

    const getRelevanceTone = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'neutral';
        }
    };

    return (
        <div className="eel-root">
            <h3 className="eel-heading">
                <span className="eel-heading-icon">✏️</span>
                Highlighted Evidence Excerpts
            </h3>
            <div className="eel-list">
                {excerpts.map((excerpt, index) => {
                    const tone = getRelevanceTone(excerpt.relevanceLevel);
                    return (
                        <div key={index} className={`eel-item eel-item--${tone}`}>
                            <div className="eel-item-header">
                                <span className="eel-index">{index + 1}</span>
                                <div className="eel-item-meta">
                                    <span className="eel-page">Page {excerpt.pageNumber || 'N/A'}</span>
                                    <span className="eel-dot">•</span>
                                    <span className={`eel-relevance eel-relevance--${tone}`}>
                                        Relevance {excerpt.relevanceLevel || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <p className="eel-quote">"{excerpt.quoteText}"</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EvidenceExcerptList;
