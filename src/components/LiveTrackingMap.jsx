import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import api from "../api/axios";
import "leaflet/dist/leaflet.css";

/**
 * LiveTrackingMap
 * Polls /api/food/:foodId/tracking every 5 seconds
 * and renders the volunteer's current position on a Leaflet map.
 */
export default function LiveTrackingMap({ foodId, donorLocation }) {
    const [tracking, setTracking] = useState(null);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const fetchTracking = async () => {
        try {
            const res = await api.get(`/food/${foodId}/tracking`);
            setTracking(res.data);
            setError(null);
        } catch (err) {
            setError("Unable to fetch tracking data");
        }
    };

    useEffect(() => {
        if (!foodId) return;
        fetchTracking();
        intervalRef.current = setInterval(fetchTracking, 5000);
        return () => clearInterval(intervalRef.current);
    }, [foodId]);

    if (error) {
        return (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex gap-2 items-start">
                <span>⚠️</span>
                <span>{error}</span>
            </div>
        );
    }

    if (!tracking) {
        return (
            <div className="flex items-center gap-3 text-sm text-neutral-500 py-4">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                Loading tracking data...
            </div>
        );
    }

    const hasVolunteerLoc =
        tracking.volunteerIsSharingLocation && tracking.volunteerLocation;

    // Default center: food location if no volunteer loc yet
    const mapCenter = hasVolunteerLoc
        ? [tracking.volunteerLocation.lat, tracking.volunteerLocation.lng]
        : donorLocation
            ? [donorLocation.lat, donorLocation.lng]
            : [18.5204, 73.8567];

    const statusColor = {
        assigned: "bg-green-100 text-green-700 border-green-200",
        pending_acceptance: "bg-blue-100 text-blue-700 border-blue-200",
        matching: "bg-yellow-100 text-yellow-700 border-yellow-200",
        delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
        expired: "bg-red-100 text-red-700 border-red-200",
    };

    const statusClass = statusColor[tracking.status] || "bg-neutral-100 text-neutral-600 border-neutral-200";

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h4 className="text-sm font-bold text-neutral-900">
                        Live Volunteer Tracking
                    </h4>
                    {tracking.ngoName && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {tracking.ngoName}
                            {tracking.ngoContact && ` • ${tracking.ngoContact}`}
                        </p>
                    )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
                    {tracking.engineStage ? tracking.engineStage.toUpperCase() : tracking.status.replace("_", " ").toUpperCase()}
                </span>
            </div>

            {/* Live pulse indicator */}
            {hasVolunteerLoc && (
                <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Volunteer location live — refreshing every 5s
                </div>
            )}

            {!hasVolunteerLoc && tracking.status === "assigned" && (
                <div className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    📍 Volunteer hasn't started location sharing yet.
                </div>
            )}

            {/* Map */}
            <div className="w-full rounded-xl overflow-hidden border border-neutral-200" style={{ height: 280 }}>
                <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Donor / food pickup location */}
                    {donorLocation && (
                        <CircleMarker
                            center={[donorLocation.lat, donorLocation.lng]}
                            radius={8}
                            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9 }}
                        >
                            <Popup>
                                <p className="text-sm font-semibold">Pickup Location</p>
                            </Popup>
                        </CircleMarker>
                    )}

                    {/* Live volunteer marker */}
                    {hasVolunteerLoc && (
                        <CircleMarker
                            center={[tracking.volunteerLocation.lat, tracking.volunteerLocation.lng]}
                            radius={10}
                            pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.95 }}
                        >
                            <Popup>
                                <p className="text-sm font-semibold">Volunteer (Live)</p>
                            </Popup>
                        </CircleMarker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
