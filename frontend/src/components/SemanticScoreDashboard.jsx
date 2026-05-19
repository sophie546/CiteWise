import React from 'react';

const ProgressBar = ({ label, score, colorClass, delayIndex }) => {
    // Assuming score is 0-100 or 0-1, handle both cases
    const percentage = score <= 1 && score > 0 ? score * 100 : score;
    
    // Slight animation delay based on index for a cascade effect
    const animationDelay = `${delayIndex * 150}ms`;
    
    return (
        <div className="mb-5 last:mb-0">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-sm font-black text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                    {percentage.toFixed(1)}%
                </span>
            </div>
            <div className="w-full bg-gray-200/60 rounded-full h-3.5 shadow-inner overflow-hidden relative">
                <div 
                    className={`h-full rounded-full ${colorClass} shadow-sm relative overflow-hidden`}
                    style={{ 
                        width: `${percentage}%`,
                        transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
                        transitionDelay: animationDelay
                    }}
                >
                    {/* Add a subtle shine effect */}
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
        </div>
    );
};

const SemanticScoreDashboard = ({ scores }) => {
    return (
        <div className="animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
                <div className="bg-indigo-100 p-1.5 rounded-md mr-3">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                Alignment Metrics
            </h3>
            
            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 shadow-sm">
                <ProgressBar 
                    label="Research Gap Alignment" 
                    score={scores.gapAlignment} 
                    colorClass="bg-gradient-to-r from-blue-500 to-cyan-400" 
                    delayIndex={0} 
                />
                <ProgressBar 
                    label="Methodology Support" 
                    score={scores.methodology} 
                    colorClass="bg-gradient-to-r from-purple-500 to-indigo-400" 
                    delayIndex={1} 
                />
                <ProgressBar 
                    label="Theoretical Framework" 
                    score={scores.theoretical} 
                    colorClass="bg-gradient-to-r from-emerald-500 to-teal-400" 
                    delayIndex={2} 
                />
                <ProgressBar 
                    label="Citation Quality & Recency" 
                    score={scores.citation} 
                    colorClass="bg-gradient-to-r from-amber-500 to-orange-400" 
                    delayIndex={3} 
                />
            </div>
            
            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
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

export default SemanticScoreDashboard;
