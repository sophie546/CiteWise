import React from 'react';

const EvidenceExcerptList = ({ excerpts }) => {
    if (!excerpts || excerpts.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-md font-medium text-gray-700 mb-1">No Evidence Extracted</h3>
                <p className="text-gray-500 text-sm">The AI couldn't identify specific excerpts matching the alignment criteria.</p>
            </div>
        );
    }

    const getRelevanceStyles = (level) => {
        switch(level?.toLowerCase()) {
            case 'high': return {
                badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                border: 'border-l-emerald-500',
                icon: 'text-emerald-500'
            };
            case 'medium': return {
                badge: 'bg-amber-100 text-amber-700 border-amber-200',
                border: 'border-l-amber-500',
                icon: 'text-amber-500'
            };
            case 'low': return {
                badge: 'bg-rose-100 text-rose-700 border-rose-200',
                border: 'border-l-rose-500',
                icon: 'text-rose-500'
            };
            default: return {
                badge: 'bg-gray-100 text-gray-700 border-gray-200',
                border: 'border-l-gray-300',
                icon: 'text-gray-400'
            };
        }
    };

    return (
        <div className="animate-fade-in-up" style={{animationDelay: '200ms', animationFillMode: 'both'}}>
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
                <div className="bg-indigo-100 p-1.5 rounded-md mr-3">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                Key Evidence Excerpts
            </h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {excerpts.map((excerpt, index) => {
                    const styles = getRelevanceStyles(excerpt.relevanceLevel);
                    return (
                        <div 
                            key={index} 
                            className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-l-4 ${styles.border} hover:shadow-md transition-all relative group`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mr-3">
                                        {index + 1}
                                    </span>
                                    <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        Page {excerpt.pageNumber || 'N/A'}
                                    </span>
                                </div>
                                <span className={`text-[10px] tracking-wide uppercase font-black px-2.5 py-1 rounded-full border shadow-sm ${styles.badge}`}>
                                    {excerpt.relevanceLevel || 'UNKNOWN'}
                                </span>
                            </div>
                            
                            <div className="relative pl-4 pr-2">
                                <div className="absolute top-0 left-0 h-full w-0.5 bg-gray-100"></div>
                                <svg className="absolute -left-2 top-0 w-4 h-4 text-gray-200 bg-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                </svg>
                                <p className="text-gray-700 text-sm leading-relaxed pt-2 pb-1 font-medium">
                                    {excerpt.quoteText}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <style jsx>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default EvidenceExcerptList;
