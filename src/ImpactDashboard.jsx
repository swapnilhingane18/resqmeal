import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { parseISO, formatDistanceToNow } from "date-fns";
import { useAuth } from "./hooks/useAuth";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import api from "./api/axios";
import { foodAPI, assignmentAPI } from "./api";
import Spinner from "./components/ui/Spinner";
import CountUp from "react-countup";

const URGENCY_COLORS = ["#dc2626", "#f59e0b", "#16a34a"];

const SUMMARY_CARDS = [
  { key: "totalDonors", label: "Total Donors" },
  { key: "totalNGOs", label: "Total NGOs" },
  { key: "totalFood", label: "Total Food" },
  { key: "totalAssignments", label: "Total Assignments" },
  { key: "unassignedFood", label: "Unassigned Food", highlighted: true },
];

const getDayKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const buildTrendData = (foods, assignments) => {
  const foodByDay = {};
  const assignmentByDay = {};

  foods.forEach((food) => {
    const key = getDayKey(food.createdAt);
    if (!key) return;
    foodByDay[key] = (foodByDay[key] || 0) + 1;
  });

  assignments.forEach((assignment) => {
    const key = getDayKey(assignment.createdAt || assignment.assignedAt);
    if (!key) return;
    assignmentByDay[key] = (assignmentByDay[key] || 0) + 1;
  });

  const days = [...new Set([...Object.keys(foodByDay), ...Object.keys(assignmentByDay)])].sort();
  return days.map((day) => ({
    day,
    label: day.slice(5).replace("-", "/"),
    foodCreated: foodByDay[day] || 0,
    assignmentsCreated: assignmentByDay[day] || 0,
  }));
};

export default function ImpactDashboard() {
  const { user, role } = useAuth();
  const isNGO = role === "NGO" || role === "ADMIN";

  const kpiChartRef = useRef(null);
  const urgencyChartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [kpiContainerReady, setKpiContainerReady] = useState(false);
  const [urgencyContainerReady, setUrgencyContainerReady] = useState(false);
  const [summary, setSummary] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [urgencyData, setUrgencyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // New State for Urgency Counts
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  // Scan State
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleEmergencyScan = async () => {
    try {
      setScanning(true);
      const res = await api.post("/emergency/scan");
      const data = res.data?.data;
      setScanResult(data);

      // Refresh Dashboard Data
      // We can trigger a re-mount or just re-fetch. 
      // For simplicity, let's reload window or re-fetch if we extracted fetch logic.
      // Since fetchDashboard is inside useEffect, we can't easily call it. 
      // We'll just reload for Hackathon speed as per "Refresh dashboard and NGO feed" requirement.
      // Or better, we can move fetchDashboard out.
      // Let's just show the toast and reload after a delay.

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("Scan failed:", err);
      setError("Emergency scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    const bindSizeObserver = (ref, setReady, label) => {
      const node = ref.current;
      if (!node) return () => { };

      const measure = () => {
        const width = node.offsetWidth;
        const height = node.offsetHeight;
        setReady(width > 0 && height > 0);
      };

      measure();

      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(node);

      window.addEventListener("resize", measure);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", measure);
      };
    };

    const disposeKpiObserver = bindSizeObserver(kpiChartRef, setKpiContainerReady, "KPI Chart");
    const disposeUrgencyObserver = bindSizeObserver(
      urgencyChartRef,
      setUrgencyContainerReady,
      "Urgency Chart"
    );

    return () => {
      disposeKpiObserver();
      disposeUrgencyObserver();
    };
  }, [mounted]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setError("");

        const [summaryRes, foodRes, assignmentRes] = await Promise.all([
          api.get("/demo/summary"),
          foodAPI.getAll(),
          assignmentAPI.getMyAssignments(),
        ]);

        setSummary(summaryRes.data || null);

        try {
          const mapRes = await api.get("/demo/map-data");
          setMapData(mapRes.data || null);
        } catch (mapError) {
          console.error("Map data fetch error:", mapError);
          setMapData({ donors: [], ngos: [], food: [] });
        }

        const foods = Array.isArray(foodRes?.foods) ? foodRes.foods : [];
        const assignments = Array.isArray(assignmentRes?.assignments) ? assignmentRes.assignments : [];
        setTrendData(buildTrendData(foods, assignments));

        let high = 0;
        let medium = 0;
        let low = 0;
        let emergency = 0;
        let critical = 0;

        foods.forEach((food) => {
          // Use API provided Urgency Level if available, else fallback
          if (food.urgencyLevel === "EMERGENCY") emergency++;
          if (food.urgencyLevel === "CRITICAL") critical++;

          // Legacy chart buckets
          const hoursLeft = (new Date(food.expiresAt) - new Date()) / (1000 * 60 * 60);
          if (hoursLeft < 6) high += 1;
          else if (hoursLeft < 24) medium += 1;
          else low += 1;
        });

        setEmergencyCount(emergency);
        setCriticalCount(critical);

        setUrgencyData([
          { name: "High Urgency (<6h)", value: high },
          { name: "Medium Urgency (<24h)", value: medium },
          { name: "Low Urgency (>24h)", value: low },
        ]);

        const recent = foods
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map(
            (food) =>
              `${food.quantity} ${food.unit} ${food.type} listed in ${(food.description || "food donation").slice(0, 24)
              }...`
          );

        setRecentActivity(recent);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container-custom py-10 fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Live Updates</span>
        </div>
        <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tight">Impact Dashboard</h2>
        <p className="text-neutral-500 mt-2 text-lg">Real-time metrics on food rescue operations</p>
      </div>

      {/* EMERGENCY ALERT BANNER */}
      {emergencyCount > 0 && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-100 px-6 py-4 flex items-center gap-4 animate-pulse shadow-md shadow-red-50">
          <span className="text-3xl">🚨</span>
          <div>
            <h3 className="text-lg font-bold text-red-800">Emergency Rescue Active</h3>
            <p className="text-red-700">
              {emergencyCount} food items are in the EMERGENCY rescue window and being prioritized!
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EMERGENCY SCAN BUTTON & RESULT - NGO/ADMIN ONLY */}
      {isNGO && (
        <div className="flex flex-col items-center justify-center mb-12">
          <button
            onClick={handleEmergencyScan}
            disabled={scanning}
            className={`
                relative px-8 py-4 rounded-full font-bold text-white text-lg shadow-xl transition-all transform hover:scale-105 active:scale-95
                ${scanning
                ? "bg-neutral-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 animate-pulse-slow"
              }
              `}
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <Spinner className="w-5 h-5 text-white" /> Scanning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🚨 Run Emergency Rescue Scan
              </span>
            )}
          </button>

          {scanResult && (
            <div className="mt-4 p-4 bg-green-100 border border-green-200 text-green-800 rounded-lg shadow-sm text-center fade-in">
              <strong>Scan Complete!</strong> <br />
              Scanned: <CountUp end={scanResult.scannedItems} duration={1} /> |
              Rescued: <CountUp end={scanResult.autoAssignedCount} duration={1} /> |
              Time: {scanResult.scanDurationMs}ms
            </div>
          )}
        </div>
      )}

      {/* NEW IMPACT COUNTERS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white text-center transform hover:scale-105 transition-transform">
          <div className="text-sm font-medium opacity-90 mb-1">Total Food Saved</div>
          <div className="text-3xl font-extrabold">
            {summary ? <CountUp end={summary.totalFood || 0} duration={1.5} suffix=" kg" /> : "--"}
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg text-white text-center transform hover:scale-105 transition-transform">
          <div className="text-sm font-medium opacity-90 mb-1">Meals Generated</div>
          <div className="text-3xl font-extrabold">
            {summary ? <CountUp end={(summary.totalFood || 0) * 5} duration={1.5} separator="," /> : "--"}
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg text-white text-center transform hover:scale-105 transition-transform">
          <div className="text-sm font-medium opacity-90 mb-1">Emergency Rescues</div>
          <div className="text-3xl font-extrabold">
            <CountUp end={emergencyCount + (scanResult?.autoAssignedCount || 0)} duration={1.5} />
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg text-white text-center transform hover:scale-105 transition-transform">
          <div className="text-sm font-medium opacity-90 mb-1">Rescue Efficiency</div>
          <div className="text-3xl font-extrabold">
            {summary && summary.totalFood > 0 ? (
              <CountUp
                end={((summary.totalAssignments || 0) / summary.totalFood) * 100}
                duration={1.5}
                decimals={1}
                suffix="%"
              />
            ) : "--"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-12">
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.key}
            className={`card transition-all duration-300 ${card.highlighted
              ? "border-red-200 bg-red-50/70 shadow-lg shadow-red-100/60"
              : "border-neutral-100 shadow-lg shadow-neutral-100/50"
              }`}
          >
            <div className={`text-sm font-semibold ${card.highlighted ? "text-red-700" : "text-neutral-500"}`}>
              {card.label}
            </div>
            <div className={`mt-2 text-4xl font-black ${card.highlighted ? "text-red-700" : "text-neutral-900"}`}>
              {summary ? (
                <CountUp end={summary[card.key] || 0} duration={1.2} />
              ) : "--"}
            </div>
          </div>
        ))}
      </div>

      {/* URGENCY SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        <div className="card border-red-200 bg-red-50 shadow-lg shadow-red-50">
          <div className="text-sm font-semibold text-red-800">Emergency Items (High Risk)</div>
          <div className="mt-2 text-4xl font-black text-red-900">{emergencyCount}</div>
        </div>
        <div className="card border-orange-200 bg-orange-50 shadow-lg shadow-orange-50">
          <div className="text-sm font-semibold text-orange-800">Critical Items (Warning)</div>
          <div className="mt-2 text-4xl font-black text-orange-900">{criticalCount}</div>
        </div>
      </div>

      <div className="card shadow-lg shadow-neutral-100/50 mb-8">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">KPI Trend Chart</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Daily trend for food records and assignment records.
        </p>
        <div ref={kpiChartRef} className="h-[320px] w-full">
          {mounted && kpiContainerReady && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ fontWeight: 600, color: "#374151" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="foodCreated"
                  name="Food Created"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="assignmentsCreated"
                  name="Assignments Created"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-neutral-400">
              No trend data available yet.
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-lg shadow-neutral-100/50 mb-8">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Geographic View</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Live markers for donors, NGOs, and food pickups.
        </p>
        <div className="w-full overflow-hidden rounded-xl border border-neutral-200">
          <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ height: "400px", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {(mapData?.donors || [])
              .filter((donor) => donor?.location?.latitude != null && donor?.location?.longitude != null)
              .map((donor) => (
                <CircleMarker
                  key={`donor-${donor._id}`}
                  center={[donor.location.latitude, donor.location.longitude]}
                  radius={8}
                  pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{donor.name || "Donor"}</p>
                      <p>Role: {donor.role || "DONOR"}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {(mapData?.ngos || [])
              .filter((ngo) => ngo?.lat != null && ngo?.lng != null)
              .map((ngo) => (
                <CircleMarker
                  key={`ngo-${ngo._id}`}
                  center={[ngo.lat, ngo.lng]}
                  radius={8}
                  pathOptions={{ color: "#7e22ce", fillColor: "#a855f7", fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{ngo.name || "NGO"}</p>
                      <p>Active: {ngo.active ? "Yes" : "No"}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {(mapData?.food || [])
              .filter((item) => item?.lat != null && item?.lng != null)
              .map((item) => {
                const isAssigned = item.status === "assigned";
                return (
                  <CircleMarker
                    key={`food-${item._id}`}
                    center={[item.lat, item.lng]}
                    radius={7}
                    pathOptions={{
                      color: isAssigned ? "#15803d" : "#b91c1c",
                      fillColor: isAssigned ? "#22c55e" : "#ef4444",
                      fillOpacity: 0.9,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{item.description || "Food item"}</p>
                        <p>Status: {item.status || "unknown"}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card shadow-lg shadow-neutral-100/50">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">AI Prioritized Pickups</h3>

          <div ref={urgencyChartRef} className="h-[300px] w-full">
            {mounted && urgencyContainerReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {urgencyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={URGENCY_COLORS[index % URGENCY_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ fontWeight: 600, color: "#374151" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-neutral-400">
                Loading chart...
              </div>
            )}
          </div>

          <p className="text-center text-sm text-neutral-400 mt-4 italic">
            Real-time urgency distribution of active donations.
          </p>
        </div>

        <div className="card shadow-lg shadow-neutral-100/50">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((text, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100 items-start">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0"></div>
                  <p className="text-neutral-600 text-sm leading-relaxed">{text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-neutral-400">No recent activity to show</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
