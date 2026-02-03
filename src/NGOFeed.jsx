export default function NGOFeed({ onAccept }) {
  const foodList = [
    {
      id: 1,
      food: "Rice & Dal",
      quantity: "30 people",
      time: "6:00 PM",
      location: "Hotel Sunrise",
      urgency: "High",
    },
    {
      id: 2,
      food: "Chapati & Sabzi",
      quantity: "20 people",
      time: "7:00 PM",
      location: "College Hostel",
      urgency: "Medium",
    },
    {
      id: 3,
      food: "Snacks",
      quantity: "15 people",
      time: "8:00 PM",
      location: "Event Hall",
      urgency: "Low",
    },
  ];

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🤝 Available Food Pickups</h2>

      <div style={styles.list}>
        {foodList.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.row}>
              <strong>{item.food}</strong>
              <span style={styles.badge(item.urgency)}>
                {item.urgency}
              </span>
            </div>

            <p>🍽️ Quantity: {item.quantity}</p>
            <p>⏰ Pickup by: {item.time}</p>
            <p>📍 Location: {item.location}</p>

            <button
              style={styles.button}
              onClick={onAccept}
            >
              Accept Pickup
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3fdf7",
    padding: "32px",
  },

  title: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#065f46",
    textAlign: "center",
  },

  list: {
    maxWidth: "700px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  badge: (urgency) => ({
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#ffffff",
    background:
      urgency === "High"
        ? "#dc2626"
        : urgency === "Medium"
        ? "#f59e0b"
        : "#16a34a",
  }),

  button: {
    marginTop: "12px",
    padding: "10px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
