import React, { useState, useEffect } from 'react';
import SemanticScoreDashboard from './SemanticScoreDashboard';
import EvidenceExcerptList from './EvidenceExcerptList';

const AIAssessmentPanel = ({ documentId }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!documentId) return;

        const fetchInsights = async () => {
            setLoading(true);
            try {
                // Determine API URL based on environment or fallback to localhost
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
                const response = await fetch(`${apiUrl}/api/v1/documents/${documentId}/insights`);
                
                if (response.status === 404) {
                    setInsights(null);
                    setError(null);
                    return;
                }
                
                if (!response.ok) {
                    throw new Error('Failed to fetch document insights');
                }
                
                const data = await response.json();
                setInsights(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [documentId]);

    if (!documentId) return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-gray-500 font-medium">Please select a document to view AI insights.</p>
        </div>
    );
    
    if (loading) return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Analyzing document content...</p>
        </div>
    );
    
    if (error) return (
        <div className="bg-rose-50 rounded-lg shadow-sm border border-rose-100 p-6 flex items-start">
            <svg className="w-6 h-6 text-rose-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
                <h3 className="text-rose-800 font-bold mb-1">Analysis Error</h3>
                <p className="text-rose-600 text-sm">{error}</p>
            </div>
        </div>
    );
    
    if (!insights) return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-gray-500 font-medium">No insights are currently available for this document.</p>
            <p className="text-gray-400 text-sm mt-2">The document may still be processing or failed semantic extraction.</p>
        </div>
    );

    const scores = {
        gapAlignment: insights.gapAlignmentScore || 0,
        methodology: insights.methodologyScore || 0,
        theoretical: insights.theoreticalScore || 0,
        citation: insights.citationScore || 0
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all hover:shadow-2xl duration-300">
            <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 p-6 md:p-8 border-b border-indigo-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">AI Assessment Results</h2>
                </div>
                <p className="text-sm text-gray-600 ml-11">Advanced semantic analysis of document alignment, framework, and methodology.</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
                <SemanticScoreDashboard scores={scores} />
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-4 bg-white text-sm text-gray-400">Detailed Findings</span>
                    </div>
                </div>
                
                <EvidenceExcerptList excerpts={insights.evidenceExcerpts || []} />
            </div>
        </div>
    );
};

export default AIAssessmentPanel;
