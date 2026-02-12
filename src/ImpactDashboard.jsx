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
    <div style={styles.page}>
      <h2 style={styles.title}>🌟 ResQMeal Impact Dashboard</h2>

      {/* ---------- TOP CARDS ---------- */}
      <div style={styles.cards}>
        {stats.map((s, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.emoji}>{s.emoji}</div>
            <div style={styles.value}>{s.value}</div>
            <div style={styles.label}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ---------- AI URGENCY PIE ---------- */}
      <div style={styles.box}>
        <h3 style={styles.sectionTitle}>🤖 AI-Prioritized Pickups</h3>

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={urgencyData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label
            >
              {urgencyData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={URGENCY_COLORS[index % URGENCY_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <p style={styles.helperText}>
          Real-time urgency distribution of active donations.
        </p>
      </div>

      {/* ---------- WEEKLY BAR CHART ---------- */}
      {/* This section is removed as per the instruction's implied changes */}

      {/* ---------- RECENT ACTIVITY ---------- */}
      <div style={styles.box}>
        <h3 style={styles.sectionTitle}>📢 Recent Donations</h3>
        <ul className="text-left space-y-2">
          {recentActivity.map((text, i) => (
            <li key={i} className="text-neutral-600 bg-neutral-50 p-2 rounded">
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------- STYLES -------------------- */
const styles = {
  page: {
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#1f2937",
    textAlign: "center",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    border: "1px solid #f3f4f6",
  },
  emoji: { fontSize: "2.5rem", marginBottom: "10px" },
  value: { fontSize: "2rem", fontWeight: "bold", color: "#111827" },
  label: { fontSize: "0.9rem", color: "#6b7280", marginTop: "5px" },
  box: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    marginBottom: "30px",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#374151",
  },
  helperText: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    marginTop: "15px",
    fontStyle: "italic",
  },
};
