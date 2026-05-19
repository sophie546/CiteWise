import React from 'react';

const SemanticScoreDashboard = ({ scores }) => {
    const metrics = [
        { label: 'Research Gap Alignment', value: scores.gapAlignment, delay: 0 },
        { label: 'Methodological Relevance', value: scores.methodology, delay: 1 },
        { label: 'Theoretical Contribution', value: scores.theoretical, delay: 2 },
        { label: 'Citation Quality', value: scores.citation, delay: 3 },
    ];

    return (
        <div className="ssd-root">
            <h3 className="ssd-heading">
                <span className="ssd-heading-icon">📊</span>
                Semantic Alignment Scores
            </h3>
            <div className="ssd-bars">
                {metrics.map((m, i) => {
                    const pct = m.value <= 1 && m.value > 0 ? m.value * 100 : m.value;
                    return (
                        <div key={m.label} className="ssd-bar-row" style={{ animationDelay: `${m.delay * 120}ms` }}>
                            <div className="ssd-bar-header">
                                <span className="ssd-bar-label">{m.label}</span>
                                <span className="ssd-bar-value">{Math.round(pct)}%</span>
                            </div>
                            <div className="ssd-bar-track">
                                <div
                                    className="ssd-bar-fill"
                                    style={{
                                        width: `${pct}%`,
                                        transitionDelay: `${m.delay * 150}ms`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SemanticScoreDashboard;
