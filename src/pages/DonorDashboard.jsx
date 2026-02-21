import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { foodAPI, assignmentAPI } from "../api";

const SUMMARY_CARDS = [
    {
        key: "totalFoodDonated",
        label: "Total Food Donated",
        icon: "🥗",
        color: "from-green-500 to-emerald-400",
    },
    {
        key: "mealsGenerated",
        label: "Meals Generated",
        icon: "🍽️",
        color: "from-blue-500 to-sky-400",
    },
    {
        key: "totalDonations",
        label: "Total Donations",
        icon: "🤝",
        color: "from-purple-500 to-violet-400",
    },
    {
        key: "pickupsCompleted",
        label: "Pickups Completed",
        icon: "✅",
        color: "from-orange-500 to-amber-400",
    },
];

export default function DonorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [foodRes, assignmentRes] = await Promise.all([
                    foodAPI.getAll().catch(() => ({ foods: [] })),
                    assignmentAPI.getMyAssignments().catch(() => ({ assignments: [] })),
                ]);
                setDonations(Array.isArray(foodRes?.foods) ? foodRes.foods : []);
                setAssignments(Array.isArray(assignmentRes?.assignments) ? assignmentRes.assignments : []);
            } catch (_) {
                setDonations([]);
                setAssignments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = {
        totalFoodDonated: donations.length,
        mealsGenerated: donations.reduce((acc, f) => acc + (Number(f.quantity) || 0), 0),
        totalDonations: donations.length,
        pickupsCompleted: assignments.filter((a) => a.status === "completed").length,
    };

    const activeDonations = donations.filter((f) => f.status === "available" || f.status === "assigned");
    const donationHistory = donations.filter((f) => f.status === "delivered" || f.status === "expired");

    if (loading) {
        return (
            <div className="p-10 flex justify-center">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="container-custom py-10 fade-in">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-4">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Donor Portal</span>
                </div>
                <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
                    Welcome, {user?.name || "Donor"} 👋
                </h2>
                <p className="text-neutral-500 mt-2 text-lg">Your food donations are making a real difference.</p>
                <button
                    type="button"
                    onClick={() => navigate("/donor/add-food")}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                >
                    🥗 Donate Food
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {SUMMARY_CARDS.map((card) => (
                    <div
                        key={card.key}
                        className="card rounded-2xl p-6 flex flex-col items-center text-center shadow-md border border-neutral-100 hover:shadow-lg transition-all"
                    >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-3 shadow`}>
                            {card.icon}
                        </div>
                        <div className="text-3xl font-extrabold text-neutral-900">{stats[card.key]}</div>
                        <div className="text-sm text-neutral-500 mt-1 font-medium">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Active Donations Table */}
            <div className="card rounded-2xl shadow-md border border-neutral-100 mb-10">
                <div className="p-6 border-b border-neutral-100">
                    <h3 className="text-xl font-bold text-neutral-900">🟢 My Active Donations</h3>
                    <p className="text-sm text-neutral-500 mt-1">Food currently available or awaiting pickup.</p>
                </div>
                <div className="overflow-x-auto">
                    {activeDonations.length === 0 ? (
                        <div className="py-12 text-center text-neutral-400 text-sm">
                            No active donations at the moment. <br />
                            <button
                                type="button"
                                onClick={() => navigate("/donor/add-food")}
                                className="mt-3 text-green-600 font-semibold hover:underline"
                            >
                                + Add a donation
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 uppercase text-xs">
                                    <th className="px-6 py-3 text-left font-semibold">Type</th>
                                    <th className="px-6 py-3 text-left font-semibold">Qty</th>
                                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                                    <th className="px-6 py-3 text-left font-semibold">Expires</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {activeDonations.map((food) => (
                                    <tr key={food._id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-neutral-800 capitalize">{food.type || "—"}</td>
                                        <td className="px-6 py-4 text-neutral-600">{food.quantity} {food.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${food.status === "assigned" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                                {food.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-500">
                                            {food.expiresAt ? new Date(food.expiresAt).toLocaleDateString() : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Donation History */}
            <div className="card rounded-2xl shadow-md border border-neutral-100">
                <div className="p-6 border-b border-neutral-100">
                    <h3 className="text-xl font-bold text-neutral-900">📋 Donation History</h3>
                    <p className="text-sm text-neutral-500 mt-1">Past donations that have been picked up or expired.</p>
                </div>
                <div className="overflow-x-auto">
                    {donationHistory.length === 0 ? (
                        <div className="py-12 text-center text-neutral-400 text-sm">
                            No donation history yet.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 uppercase text-xs">
                                    <th className="px-6 py-3 text-left font-semibold">Type</th>
                                    <th className="px-6 py-3 text-left font-semibold">Qty</th>
                                    <th className="px-6 py-3 text-left font-semibold">Outcome</th>
                                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {donationHistory.map((food) => (
                                    <tr key={food._id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-neutral-800 capitalize">{food.type || "—"}</td>
                                        <td className="px-6 py-4 text-neutral-600">{food.quantity} {food.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${food.status === "delivered" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                                {food.status === "delivered" ? "✅ Delivered" : "⏰ Expired"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-500">
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
    );
}
