import React from 'react';

const ScoreBar = ({ label, value, colorClass }) => (
    <div className="mb-4 group">
        <div className="flex justify-between text-sm font-medium mb-1.5">
            <span className="text-neutral-600 group-hover:text-neutral-900 transition-colors">{label}</span>
            <span className="text-neutral-900 font-bold">{value}/100</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
                className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out transform origin-left hover:brightness-110 relative overflow-hidden`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>
    </div>
);

const ScoreVisualization = ({ assignment }) => {
    if (!assignment) return null;

    // Extract scores, handling potential missing fields safely
    const {
        totalScore = 0,
        distanceScore = 0,
        urgencyScore = 0,
        capacityScore = 0,
        loadBalanceScore = 0
    } = assignment;

    const getScoreColor = (score) => {
        if (score >= 80) return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]";
        if (score >= 50) return "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]";
        return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xl shadow-green-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative">
                <div>
                    <h3 className="font-bold text-xl text-neutral-900 flex items-center gap-2">
                        🤖 AI Match Analysis
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Breakdown of assignment logic</p>
                </div>
                <div className="text-right bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100">
                    <span className="text-xs text-neutral-500 font-medium block uppercase tracking-wider">Total Match Score</span>
                    <span className={`text-3xl font-black ${totalScore >= 80 ? 'text-green-600' : 'text-neutral-900'}`}>
                        {totalScore.toFixed(1)}
                    </span>
                </div>
            </div>

            <div className="space-y-2 relative z-10">
                <ScoreBar
                    label="📍 Proximity (40%)"
                    value={distanceScore}
                    colorClass="bg-blue-500"
                />
                <ScoreBar
                    label="⏰ Urgency (30%)"
                    value={urgencyScore}
                    colorClass="bg-red-500"
                />
                <ScoreBar
                    label="📦 Capacity (20%)"
                    value={capacityScore}
                    colorClass="bg-emerald-500"
                />
                <ScoreBar
                    label="⚖️ Load Balance (10%)"
                    value={loadBalanceScore}
                    colorClass="bg-purple-500"
                />
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-100 text-center relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-xs text-green-800 font-medium tracking-wide">
                        Optimized using weighted multi-factor decision engine.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScoreVisualization;
