const Assignment = require("../models/Assignment");
const NGO = require("../models/NGO");

// GET /api/analytics/ngo-performance
const getNgoPerformance = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$ngo",
                    totalAssignments: { $sum: 1 },
                    acceptedCount: {
                        $sum: { $cond: [{ $in: ["$status", ["accepted", "completed"]] }, 1, 0] }
                    },
                    rejectedCount: {
                        $sum: { $cond: [{ $in: ["$status", ["rejected", "timed_out"]] }, 1, 0] }
                    },
                    avgResponseTime: { $avg: "$responseTime" },
                    avgEscalationDepth: { $avg: "$escalationDepth" },
                    onTimeAcceptances: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $in: ["$status", ["accepted", "completed"]] },
                                        { $lt: ["$responseTime", 120000] } // 2 min SLA
                                    ]
                                }, 1, 0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "ngos",
                    localField: "_id",
                    foreignField: "_id",
                    as: "ngoDetails"
                }
            },
            { $unwind: "$ngoDetails" },
            {
                $project: {
                    _id: 1,
                    name: "$ngoDetails.name",
                    totalAssignments: 1,
                    acceptedCount: 1,
                    rejectedCount: 1,
                    avgResponseTimeMs: { $ifNull: ["$avgResponseTime", 0] },
                    avgEscalationDepth: 1,
                    acceptanceRate: {
                        $cond: [
                            { $gt: ["$totalAssignments", 0] },
                            { $multiply: [{ $divide: ["$acceptedCount", "$totalAssignments"] }, 100] },
                            0
                        ]
                    },
                    rejectionRate: {
                        $cond: [
                            { $gt: ["$totalAssignments", 0] },
                            { $multiply: [{ $divide: ["$rejectedCount", "$totalAssignments"] }, 100] },
                            0
                        ]
                    },
                    slaCompliance: {
                        $cond: [
                            { $gt: ["$acceptedCount", 0] },
                            { $multiply: [{ $divide: ["$onTimeAcceptances", "$acceptedCount"] }, 100] },
                            0
                        ]
                    }
                }
            }
        ];

        const results = await Assignment.aggregate(pipeline);

        // Add dynamically computed weighted score 
        // Higher acceptance, lower rejections, higher SLA, lower response times = better score
        const weightedResults = results.map(ngo => {
            const accWeight = (ngo.acceptanceRate || 0) * 0.4;
            const slaWeight = (ngo.slaCompliance || 0) * 0.4;

            let responsePenalty = 0;
            if (ngo.avgResponseTimeMs > 60000) responsePenalty = 10;
            if (ngo.avgResponseTimeMs > 120000) responsePenalty = 20;

            const rejPenalty = (ngo.rejectionRate || 0) * 0.2;

            let finalScore = accWeight + slaWeight - responsePenalty - rejPenalty;
            return {
                ...ngo,
                performanceScore: Math.max(0, Math.min(100, finalScore)) // Clamp [0, 100]
            };
        });

        res.status(200).json({ success: true, matchCount: weightedResults.length, data: weightedResults });
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/system-overview
const getSystemOverview = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    totalAssignments: { $sum: 1 },
                    overallResponsesCount: {
                        $sum: { $cond: [{ $ifNull: ["$responseTime", false] }, 1, 0] }
                    },
                    totalResponseTime: { $sum: "$responseTime" },
                    rejectedAssignments: {
                        $sum: { $cond: [{ $in: ["$status", ["rejected", "timed_out"]] }, 1, 0] }
                    },
                    acceptedAssignments: {
                        $sum: { $cond: [{ $in: ["$status", ["accepted", "completed"]] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalAssignments: 1,
                    acceptedAssignments: 1,
                    avgSystemResponseTimeMs: {
                        $cond: [
                            { $gt: ["$overallResponsesCount", 0] },
                            { $divide: ["$totalResponseTime", "$overallResponsesCount"] },
                            0
                        ]
                    },
                    systemRejectionRatePerc: {
                        $cond: [
                            { $gt: ["$totalAssignments", 0] },
                            { $multiply: [{ $divide: ["$rejectedAssignments", "$totalAssignments"] }, 100] },
                            0
                        ]
                    }
                }
            }
        ];

        const result = await Assignment.aggregate(pipeline);
        res.status(200).json({ success: true, data: result[0] || {} });
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/district-heatmap
const getDistrictHeatmap = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$district",
                    totalPickups: { $sum: 1 },
                    escalationCount: {
                        $sum: { $cond: [{ $gt: ["$escalationDepth", 0] }, 1, 0] }
                    },
                    avgResponseTime: { $avg: "$responseTime" },
                    slaBreaches: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $gt: ["$responseTime", 120000] },
                                        { $in: ["$status", ["timed_out", "rejected"]] }
                                    ]
                                }, 1, 0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    district: "$_id",
                    totalPickups: 1,
                    escalationCount: 1,
                    avgResponseTimeMs: { $ifNull: ["$avgResponseTime", 0] },
                    slaBreachCount: "$slaBreaches",
                    _id: 0
                }
            }
        ];

        const data = await Assignment.aggregate(pipeline);
        res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/escalation-metrics
const getEscalationMetrics = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$escalationDepth",
                    count: { $sum: 1 },
                    successfulAccepts: {
                        $sum: { $cond: [{ $in: ["$status", ["accepted", "completed"]] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ];

        const aggregated = await Assignment.aggregate(pipeline);

        // Calculate global overview
        let maxEscalationDepth = 0;
        let totalAssignments = 0;
        let sumEscalationProduct = 0;

        // Map distribution to readable formats
        const distribution = aggregated.map(level => {
            if (level._id > maxEscalationDepth) maxEscalationDepth = level._id;
            totalAssignments += level.count;
            sumEscalationProduct += (level._id * level.count);

            return {
                hopDepth: level._id,
                label: level._id === 0 ? "Accepted at 1st NGO" : `Accepted at NGO #${level._id + 1}`,
                totalTicketsAtDepth: level.count,
                successesAtDepth: level.successfulAccepts
            };
        });

        const avgEscalationDepth = totalAssignments > 0 ? (sumEscalationProduct / totalAssignments).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                maxEscalationDepth,
                avgEscalationDepth: Number(avgEscalationDepth),
                distribution
            }
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/sla-report
const getSlaReport = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    totalAssignments: { $sum: 1 },
                    onTimeAcceptances: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $in: ["$status", ["accepted", "completed"]] },
                                        { $lte: ["$responseTime", 120000] }
                                    ]
                                }, 1, 0
                            ]
                        }
                    },
                    timedOutEscalations: {
                        $sum: { $cond: [{ $eq: ["$status", "timed_out"] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalAssignments: 1,
                    onTimeAcceptances: 1,
                    timedOutEscalations: 1,
                    compliancePercentage: {
                        $cond: [
                            { $gt: ["$totalAssignments", 0] },
                            { $multiply: [{ $divide: ["$onTimeAcceptances", "$totalAssignments"] }, 100] },
                            0
                        ]
                    }
                }
            }
        ];

        const data = await Assignment.aggregate(pipeline);
        res.status(200).json({ success: true, data: data[0] || {} });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getNgoPerformance,
    getSystemOverview,
    getDistrictHeatmap,
    getEscalationMetrics,
    getSlaReport
};
