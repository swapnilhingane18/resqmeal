import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { foodAPI, assignmentAPI } from "./api"; // Ensure these export methods to get all data if possible
import Spinner from "./components/ui/Spinner";

/* -------------------- CONSTANTS & UTILS -------------------- */
const URGENCY_COLORS = ["#dc2626", "#f59e0b", "#16a34a"];

export default function ImpactDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Meals Rescued", value: 0, emoji: "🍽️" },
    { label: "Food Saved (kg)", value: 0, emoji: "⚖️" },
    { label: "CO₂ Prevented (kg)", value: 0, emoji: "🌍" },
  ]);
  const [urgencyData, setUrgencyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all foods (assuming an admin/public endpoint or using NGO feed as proxy)
        // For hackathon demo, we might need a way to get *all* data. 
        // Let's assume foodAPI.getAll({ status: 'all' }) works or similar.
        // If not, we'll work with what we have.
        const foodResponse = await foodAPI.getAll();
        const foods = foodResponse.foods || [];

        // Calculate Stats
        const totalQuantity = foods.reduce((acc, f) => acc + (f.quantity || 0), 0);
        const mealsRescued = Math.floor(totalQuantity * 4); // Approx 4 meals per kg/unit
        const co2Saved = Math.floor(totalQuantity * 2.5); // Approx 2.5kg CO2 per kg food

        setStats([
          { label: "Meals Rescued", value: mealsRescued, emoji: "🍽️" },
          { label: "Food Saved (kg)", value: totalQuantity.toFixed(1), emoji: "⚖️" },
          { label: "CO₂ Prevented (kg)", value: co2Saved, emoji: "🌍" },
        ]);

        // Calculate Urgency Distribution (Client-side logic for demo)
        let high = 0, medium = 0, low = 0;
        foods.forEach(f => {
          const hoursLeft = (new Date(f.expiresAt) - new Date()) / (1000 * 60 * 60);
          if (hoursLeft < 6) high++;
          else if (hoursLeft < 24) medium++;
          else low++;
        });

        setUrgencyData([
          { name: "High Urgency (<6h)", value: high },
          { name: "Medium Urgency (<24h)", value: medium },
          { name: "Low Urgency (>24h)", value: low },
        ]);

        // Generate Recent Activity from real data
        const recent = foods
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map(f => `${f.quantity} ${f.unit} ${f.type} listed in ${f.description?.substring(0, 10)}...`);

        setRecentActivity(recent);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-10 flex justify-center"><Spinner /></div>;
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
        <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
          Impact Dashboard
        </h2>
        <p className="text-neutral-500 mt-2 text-lg">Real-time metrics on food rescue operations</p>
      </div>

      {/* ---------- TOP CARDS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="card border-neutral-100 shadow-lg shadow-neutral-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4 filter drop-shadow-sm">{s.emoji}</div>
            <div className="text-4xl font-black text-neutral-900 mb-1">{s.value}</div>
            <div className="text-neutral-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ---------- AI URGENCY PIE ---------- */}
        <div className="card shadow-lg shadow-neutral-100/50">
          <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <span>🤖</span> AI-Prioritized Pickups
          </h3>

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
                    <Cell
                      key={`cell-${index}`}
                      fill={URGENCY_COLORS[index % URGENCY_COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 600, color: '#374151' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <p className="text-center text-sm text-neutral-400 mt-4 italic">
            Real-time urgency distribution of active donations.
          </p>
        </div>

        {/* ---------- RECENT ACTIVITY ---------- */}
        <div className="card shadow-lg shadow-neutral-100/50">
          <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <span>📢</span> Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((text, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100 items-start">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0"></div>
                  <p className="text-neutral-600 text-sm leading-relaxed">{text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-neutral-400">
                No recent activity to show
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- STYLES -------------------- */
const styles = {};
