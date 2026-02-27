import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

/**
 * NGOAcceptancePanel
 * Shown to NGO users when a food assignment is in `pending_acceptance` state.
 * Handles Accept / Reject with a live countdown timer.
 * After acceptance, provides a Location Sharing toggle.
 */
export default function NGOAcceptancePanel({ food, onActionComplete }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sharingLocation, setSharingLocation] = useState(
        food?.volunteer?.isSharingLocation || false
    );
    const [watchId, setWatchId] = useState(null);
    const intervalRef = useRef(null);

    // Countdown timer
    useEffect(() => {
        if (!food?.acceptanceExpiresAt) return;

        const tick = () => {
            const remaining = Math.max(
                0,
                Math.floor((new Date(food.acceptanceExpiresAt) - Date.now()) / 1000)
            );
            setTimeLeft(remaining);
            if (remaining === 0) clearInterval(intervalRef.current);
        };

        tick();
        intervalRef.current = setInterval(tick, 1000);
        return () => clearInterval(intervalRef.current);
    }, [food?.acceptanceExpiresAt]);

    const formatTime = (secs) => {
        if (secs === null) return "--:--";
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleAccept = async () => {
        setLoading(true);
        try {
            await api.post(`/ngo/accept/${food._id}`);
            onActionComplete?.("accepted");
        } catch (err) {
            console.error("Accept error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            await api.post(`/ngo/reject/${food._id}`);
            onActionComplete?.("rejected");
        } catch (err) {
            console.error("Reject error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLocationSharing = async (enabled) => {
        try {
            await api.patch(`/ngo/location-sharing/${food._id}`, {
                isSharingLocation: enabled,
            });
            setSharingLocation(enabled);

            if (enabled) {
                // Start watching geolocation
                if (!navigator.geolocation) return;
                const id = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { latitude: lat, longitude: lng } = pos.coords;
                        api.patch(`/food/volunteer/location/${food._id}`, { lat, lng }).catch(console.error);
                    },
                    (err) => console.error("Geolocation error:", err),
                    { enableHighAccuracy: true, maximumAge: 5000 }
                );
                setWatchId(id);
            } else {
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                    setWatchId(null);
                }
            }
        } catch (err) {
            console.error("Toggle error:", err.response?.data || err.message);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [watchId]);

    const isExpired = timeLeft !== null && timeLeft === 0;
    const isPending = food?.status === "pending_acceptance";
    const isAssigned = food?.status === "assigned";

    if (!food) return null;

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4 shadow-sm">
            {/* Food info header */}
            <div className="flex justify-between items-start">
                <div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-neutral-100 text-neutral-600 mb-1">
                        {food.type}
                    </span>
                    <h4 className="text-base font-bold text-neutral-900">
                        {food.quantity} {food.unit}
                        {food.description ? ` • ${food.description}` : ""}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        Donor: {food.donor?.name || "Anonymous"}
                        {food.donor?.contact ? ` • ${food.donor.contact}` : ""}
                    </p>
                </div>

                {/* Countdown badge */}
                {isPending && (
                    <div
                        className={`text-center rounded-xl px-3 py-1.5 text-sm font-black tabular-nums border ${isExpired
                                ? "bg-red-50 text-red-700 border-red-200"
                                : timeLeft !== null && timeLeft < 30
                                    ? "bg-orange-50 text-orange-700 border-orange-200 animate-pulse"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                    >
                        ⏱ {formatTime(timeLeft)}
                        <div className="text-[9px] font-normal tracking-wide mt-0.5 opacity-70">
                            {isExpired ? "EXPIRED" : "WINDOW"}
                        </div>
                    </div>
                )}
            </div>

            {/* PENDING ACCEPTANCE — Accept / Reject buttons */}
            {isPending && !isExpired && (
                <div className="flex gap-3">
                    <button
                        id={`accept-food-${food._id}`}
                        onClick={handleAccept}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-sm"
                    >
                        {loading ? "..." : "✅ Accept"}
                    </button>
                    <button
                        id={`reject-food-${food._id}`}
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm border border-red-200 transition-all disabled:opacity-50"
                    >
                        {loading ? "..." : "✖ Reject"}
                    </button>
                </div>
            )}

            {isPending && isExpired && (
                <div className="text-sm text-red-600 font-semibold bg-red-50 rounded-xl p-3 border border-red-200">
                    ⚠ Acceptance window expired. This assignment will be reallocated automatically.
                </div>
            )}

            {/* ASSIGNED — Location sharing toggle */}
            {isAssigned && (
                <div className="space-y-3">
                    <div className={`rounded-xl p-3 border text-sm font-semibold ${sharingLocation ? "bg-green-50 border-green-200 text-green-800" : "bg-neutral-50 border-neutral-200 text-neutral-700"}`}>
                        {sharingLocation ? "📡 Broadcasting live location to donor" : "📍 Location sharing is off"}
                    </div>

                    <button
                        id={`toggle-location-${food._id}`}
                        onClick={() => handleToggleLocationSharing(!sharingLocation)}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${sharingLocation
                                ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                    >
                        {sharingLocation ? "🔴 Stop Location Sharing" : "🟢 Start Location Sharing"}
                    </button>
                </div>
            )}
        </div>
    );
}
