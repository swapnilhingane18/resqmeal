export default function RoleSelection({ onSelect }) {
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Welcome to ResQMeal</h2>
      <p style={styles.subtitle}>
        Choose your role to continue
      </p>

      <div style={styles.cards}>
        {/* FOOD PROVIDER */}
        <div
          style={styles.card}
          onClick={() => onSelect("provider")}
        >
          <div style={styles.emoji}>🍽️</div>
          <h3 style={styles.cardTitle}>Food Provider</h3>
          <p style={styles.cardText}>
            Restaurants, hostels, events with surplus food
          </p>
        </div>

        {/* NGO */}
        <div
          style={styles.card}
          onClick={() => onSelect("ngo")}
        >
          <div style={styles.emoji}>🤝</div>
          <h3 style={styles.cardTitle}>NGO / Volunteer</h3>
          <p style={styles.cardText}>
            Collect and distribute food to people in need
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3fdf7",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },

  title: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#065f46",
    marginBottom: "8px",
  },

  subtitle: {
    color: "#475569",
    marginBottom: "40px",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "32px",
    maxWidth: "700px",
    width: "100%",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  emoji: {
    fontSize: "42px",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#0f172a",
  },

  cardText: {
    fontSize: "14px",
    color: "#475569",
  },
};
