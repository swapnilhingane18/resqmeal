import React from 'react';

const ScoreBar = ({ label, value, colorClass = "bg-primary-600" }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-neutral-700">{label}</span>
            <span className="text-neutral-900">{value}/100</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
                className={`h-2 rounded-full ${colorClass} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            ></div>
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

    return (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="font-bold text-lg text-neutral-800">
                    🤖 AI Match Analysis
                </h3>
                <div className="text-right">
                    <span className="text-xs text-neutral-500 block">Total Match Score</span>
                    <span className="text-2xl font-black text-primary-600">{totalScore.toFixed(1)}</span>
                </div>
            </div>

            <div className="space-y-4">
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
                    colorClass="bg-green-500"
                />
                <ScoreBar
                    label="⚖️ Load Balance (10%)"
                    value={loadBalanceScore}
                    colorClass="bg-purple-500"
                />
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 text-center">
                <p className="text-xs text-neutral-500 font-medium italic">
                    Optimized using weighted multi-factor decision engine.
                </p>
            </div>
        </div>
    );
};

export default ScoreVisualization;
