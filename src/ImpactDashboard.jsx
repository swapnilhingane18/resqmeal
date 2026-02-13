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
import { useEffect, useState } from "react";
import api from "./api/axios";
import { foodAPI, assignmentAPI } from "./api";
import Spinner from "./components/ui/Spinner";

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
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [urgencyData, setUrgencyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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

        const foods = Array.isArray(foodRes?.foods) ? foodRes.foods : [];
        const assignments = Array.isArray(assignmentRes?.assignments) ? assignmentRes.assignments : [];
        setTrendData(buildTrendData(foods, assignments));

        let high = 0;
        let medium = 0;
        let low = 0;

        foods.forEach((food) => {
          const hoursLeft = (new Date(food.expiresAt) - new Date()) / (1000 * 60 * 60);
          if (hoursLeft < 6) high += 1;
          else if (hoursLeft < 24) medium += 1;
          else low += 1;
        });

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
              `${food.quantity} ${food.unit} ${food.type} listed in ${
                (food.description || "food donation").slice(0, 24)
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

      {error && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-12">
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.key}
            className={`card transition-all duration-300 ${
              card.highlighted
                ? "border-red-200 bg-red-50/70 shadow-lg shadow-red-100/60"
                : "border-neutral-100 shadow-lg shadow-neutral-100/50"
            }`}
          >
            <div className={`text-sm font-semibold ${card.highlighted ? "text-red-700" : "text-neutral-500"}`}>
              {card.label}
            </div>
            <div className={`mt-2 text-4xl font-black ${card.highlighted ? "text-red-700" : "text-neutral-900"}`}>
              {summary ? summary[card.key] : "--"}
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-lg shadow-neutral-100/50 mb-8">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">KPI Trend Chart</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Daily trend for food records and assignment records.
        </p>
        <div className="h-[320px] w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card shadow-lg shadow-neutral-100/50">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">AI Prioritized Pickups</h3>

          <div className="h-[300px] w-full">
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
