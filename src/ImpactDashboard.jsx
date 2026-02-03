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

/* -------------------- TOP STATS -------------------- */
const stats = [
  { label: "Meals Rescued", value: 1240, emoji: "🍽️" },
  { label: "Food Saved (kg)", value: 620, emoji: "⚖️" },
  { label: "CO₂ Prevented (kg)", value: 1300, emoji: "🌍" },
];

/* -------------------- BAR CHART DATA -------------------- */
const weeklyData = [
  { day: "Mon", meals: 120 },
  { day: "Tue", meals: 180 },
  { day: "Wed", meals: 240 },
  { day: "Thu", meals: 200 },
  { day: "Fri", meals: 300 },
];

/* -------------------- AI URGENCY DATA -------------------- */
const urgencyData = [
  { name: "High Urgency", value: 18 },
  { name: "Medium Urgency", value: 32 },
  { name: "Low Urgency", value: 20 },
];

const URGENCY_COLORS = ["#dc2626", "#f59e0b", "#16a34a"];

/* -------------------- RECENT FEED -------------------- */
const recent = [
  "30 meals rescued from Hotel Sunrise",
  "50 meals delivered by NGO Helping Hands",
  "20 meals saved from College Hostel",
];

export default function ImpactDashboard() {
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
                  fill={URGENCY_COLORS[index]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <p style={styles.helperText}>
          Urgency is calculated using AI based on food type, quantity, and pickup
          time.
        </p>
      </div>

      {/* ---------- WEEKLY BAR CHART ---------- */}
      <div style={styles.box}>
        <h3 style={styles.sectionTitle}>📈 Meals Rescued This Week</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="meals" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---------- RECENT ACTIVITY ---------- */}
      <div style={styles.box}>
        <h3 style={styles.sectionTitle}>🤝 Recent Rescues</h3>
        <ul>
          {recent.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------- STYLES -------------------- */
const styles = {
  page: {
    padding: "32px",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "28px",
    color: "#065f46",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  emoji: {
    fontSize: "36px",
    marginBottom: "12px",
  },

  value: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#0b341a",
  },

  label: {
    marginTop: "6px",
    fontSize: "15px",
    color: "#475569",
  },

  box: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#065f46",
  },

  helperText: {
    marginTop: "12px",
    color: "#475569",
    fontSize: "14px",
  },
};
