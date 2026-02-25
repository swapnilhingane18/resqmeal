import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { foodAPI, assignmentAPI } from "../api";

export default function DonorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Polling ref to clear on unmount
    const pollingRef = useRef(null);

    const fetchData = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const [foodRes, assignmentRes] = await Promise.all([
                foodAPI.getAll().catch(() => ({ foods: [] })),
                assignmentAPI.getMyAssignments().catch(() => ({ assignments: [] })),
            ]);
            setDonations(Array.isArray(foodRes?.foods) ? foodRes.foods : []);
            setAssignments(Array.isArray(assignmentRes?.assignments) ? assignmentRes.assignments : []);
        } catch (_) {
            if (!isBackground) {
                setDonations([]);
                setAssignments([]);
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Setup polling every 5 seconds
        pollingRef.current = setInterval(() => {
            fetchData(true);
        }, 5000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const getLatestAssignment = (foodId) => {
        // Assignments are pre-sorted by assignedAt desc from backend
        return assignments.find((a) => String(a.food?._id || a.food) === String(foodId)) || null;
    };

    const stats = {
        totalFoodDonated: donations.length,
        mealsGenerated: donations.reduce((acc, f) => {
            let q = Number(f.quantity) || 0;
            if (f.unit === 'kg') return acc + Math.floor(q * 2.5);
            if (f.unit === 'portions') return acc + Math.floor(q);
            if (f.unit === 'boxes') return acc + Math.floor(q * 2);
            if (f.unit === 'liters') return acc + Math.floor(q * 4);
            return acc + q;
        }, 0),
        totalDonations: donations.length,
        pickupsCompleted: assignments.filter((a) => a.status === "completed").length,
    };

    const SUMMARY_CARDS = [
        { key: "totalFoodDonated", label: "Donated Events", icon: "🤝" },
        { key: "mealsGenerated", label: "Meals Provided", icon: "✨" },
        { key: "totalDonations", label: "Active Nodes", icon: "📊" },
        { key: "pickupsCompleted", label: "Completed Pickups", icon: "✅" },
    ];

    const activeDonations = donations.filter((f) => ["available", "pending_acceptance", "assigned", "escalated"].includes(f.status));
    const donationHistory = donations.filter((f) => ["picked_up", "delivered", "expired", "timed_out", "cancelled"].includes(f.status));

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-500 font-medium text-sm tracking-wide animate-pulse">Syncing telemetry...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4 fade-in">
            <div className="max-w-[700px] mx-auto space-y-12">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-green-50 rounded-md px-3 py-1 mb-4 border border-green-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-green-700 tracking-widest uppercase">Live Polling</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                            Welcome, {user?.name?.split(' ')[0] || "Donor"}
                        </h2>
                        <p className="text-neutral-500 mt-1 text-base">Your donations generate real-time local impact.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/donor/add-food")}
                        className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-bold shadow-md hover:bg-neutral-800 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        + Create Donation
                    </button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {SUMMARY_CARDS.map((card) => (
                        <div key={card.key} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col justify-between">
                            <span className="text-xl mb-3">{card.icon}</span>
                            <div>
                                <div className="text-2xl font-black text-neutral-900 tracking-tight">{stats[card.key]}</div>
                                <div className="text-xs text-neutral-500 mt-1 uppercase tracking-wide font-semibold">{card.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Active Donations / Live Status Cards */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-1">Live Matching Engine</h3>
                        <p className="text-sm text-neutral-500 mb-6">Tracking assignments and NGO SLA compliances dynamically.</p>
                    </div>

                    {activeDonations.length === 0 ? (
                        <div className="bg-white border text-center border-dashed border-neutral-300 rounded-2xl py-12 px-6">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-neutral-400">📡</div>
                            <p className="text-neutral-600 font-medium">No live assignments actively matching.</p>
                            <button
                                type="button"
                                onClick={() => navigate("/donor/add-food")}
                                className="mt-2 text-sm text-green-600 font-bold hover:text-green-700"
                            >
                                Publish a new donation →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5">
                            {activeDonations.map((food) => {
                                const latestAssign = getLatestAssignment(food._id);
                                let statusUI = null;
                                let isExpiredFallback = food.status === 'available' && latestAssign && latestAssign.status === 'timed_out';

                                if (food.status === 'pending_acceptance') {
                                    if (latestAssign && latestAssign.escalationDepth > 0) {
                                        statusUI = (
                                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 text-lg">↪</div>
                                                    <div>
                                                        <h4 className="text-orange-900 font-bold text-sm">Escalated to next NGO</h4>
                                                        <p className="text-orange-800 text-xs mt-1">Escalation depth: {latestAssign.escalationDepth} • Waiting for response within SLA.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        statusUI = (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-0.5"></div>
                                                    <div>
                                                        <h4 className="text-blue-900 font-bold text-sm">Matching NGOs...</h4>
                                                        <p className="text-blue-800 text-xs mt-1">Waiting for initial response (2-minute SLA window)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                } else if (food.status === 'assigned') {
                                    const respTimeSecs = latestAssign?.responseTime ? (latestAssign.responseTime / 1000).toFixed(1) : '< 1';
                                    statusUI = (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-lg">✅</div>
                                                <div className="w-full">
                                                    <h4 className="text-green-900 font-bold text-sm">Accepted by {latestAssign?.ngo?.name || "NGO Partner"}</h4>
                                                    <p className="text-green-800 text-xs mt-1">SLA fulfilled • Response Time: {respTimeSecs} seconds</p>

                                                    {(latestAssign?.pickedUpAt || latestAssign?.deliveryVerified) && (
                                                        <div className="mt-3 bg-white bg-opacity-60 rounded-lg p-3 border border-green-100 flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-green-900">
                                                                <span>🔒</span> Verified Delivery Tracking
                                                            </div>
                                                            {latestAssign?.pickedUpAt && (
                                                                <div className="flex items-center gap-2 text-xs text-green-800">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                                    Picked up at {new Date(latestAssign.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            )}
                                                            {latestAssign?.deliveryVerified && (
                                                                <div className="flex items-center gap-2 text-xs text-green-800 font-semibold">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                                    Delivery Verified
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else if (isExpiredFallback) {
                                    statusUI = (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-lg text-red-500">⚠</div>
                                                <div>
                                                    <h4 className="text-red-900 font-bold text-sm">Escalation Exhausted</h4>
                                                    <p className="text-red-800 text-xs mt-1">No NGO picked up the connection. Try extending expiry time.</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    statusUI = (
                                        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-lg text-neutral-500">⏳</div>
                                                <div>
                                                    <h4 className="text-neutral-900 font-bold text-sm">Queued into System</h4>
                                                    <p className="text-neutral-600 text-xs mt-1">Initializing optimization scan...</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={food._id} className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-neutral-100 text-neutral-600 mb-2">
                                                    {food.type}
                                                </div>
                                                <h4 className="text-base font-bold text-neutral-900 capitalize">{food.quantity} {food.unit} • {food.description || "Donation"}</h4>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-neutral-400 font-medium">Expires</span>
                                                <p className="text-sm font-semibold text-neutral-700">{food.expiresAt ? new Date(food.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</p>
                                            </div>
                                        </div>
                                        {statusUI}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Donation History Table */}
                <div className="pt-8">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-1">Archived Sessions</h3>
                        <p className="text-sm text-neutral-500 mb-6">Past donation blocks finalized or expired from the blockchain.</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            {donationHistory.length === 0 ? (
                                <div className="py-10 text-center text-neutral-400 text-sm">
                                    No archive history yet.
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-neutral-50 text-neutral-500 uppercase text-[10px] tracking-widest font-bold">
                                            <th className="px-6 py-4 text-left">Food Log</th>
                                            <th className="px-6 py-4 text-left">Resolved State</th>
                                            <th className="px-6 py-4 text-left">Close Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {donationHistory.map((food) => (
                                            <tr key={food._id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-neutral-900 block">{food.quantity} {food.unit}</span>
                                                    <span className="text-xs text-neutral-500 capitalize">{food.type}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${food.status === "delivered" || food.status === "picked_up" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                                                        }`}>
                                                        {food.status === "delivered" || food.status === "picked_up" ? "✅ Success" : "Archived"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-neutral-500 font-medium">
                                                    {food.updatedAt ? new Date(food.updatedAt).toLocaleDateString() : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
