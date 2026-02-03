import { useState } from "react";

const STATUS_FLOW = ["Posted", "Accepted", "Picked Up"];

const STATUS_COPY = {
  Posted: "Donation posted. Waiting for an NGO to accept.",
  Accepted: "Pickup accepted by an NGO. Coordinating pickup now.",
  "Picked Up": "Donation picked up. Thank you for helping!",
};

const statusColors = {
  Posted: "#64748b",
  Accepted: "#0ea5e9",
  "Picked Up": "#16a34a",
};

export default function NGOFeed() {
  const [foodList, setFoodList] = useState([
    {
      id: 1,
      food: "Rice & Dal",
      quantity: "30 people",
      time: "6:00 PM",
      location: "Hotel Sunrise",
      urgency: "High",
      status: "Posted",
    },
    {
      id: 2,
      food: "Chapati & Sabzi",
      quantity: "20 people",
      time: "7:00 PM",
      location: "College Hostel",
      urgency: "Medium",
      status: "Posted",
    },
    {
      id: 3,
      food: "Snacks",
      quantity: "15 people",
      time: "8:00 PM",
      location: "Event Hall",
      urgency: "Low",
      status: "Posted",
    },
  ]);

  const updateStatus = (id, nextStatus) => {
    setFoodList((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      )
    );
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🤝 Available Food Pickups</h2>

      <div style={styles.flowCard}>
        <h3 style={styles.flowTitle}>Pickup Status Flow</h3>
        <ul style={styles.flowList}>
          <li>
            <strong>Posted:</strong> Donation is listed and waiting for an NGO.
          </li>
          <li>
            <strong>Accepted:</strong> An NGO has claimed the pickup.
          </li>
          <li>
            <strong>Picked Up:</strong> The food has been collected.
          </li>
        </ul>
      </div>

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

            <div style={styles.statusRow}>
              {STATUS_FLOW.map((status) => (
                <span
                  key={status}
                  style={styles.statusBadge(status, item.status)}
                >
                  {status}
                </span>
              ))}
            </div>

            <p style={styles.statusText}>
              {STATUS_COPY[item.status]}
            </p>

            <div style={styles.actions}>
              {item.status === "Posted" && (
                <button
                  style={styles.button}
                  onClick={() => updateStatus(item.id, "Accepted")}
                >
                  Accept Pickup
                </button>
              )}
              {item.status === "Accepted" && (
                <button
                  style={styles.button}
                  onClick={() => updateStatus(item.id, "Picked Up")}
                >
                  Mark Picked Up
                </button>
              )}
              {item.status === "Picked Up" && (
                <button style={styles.buttonDisabled} disabled>
                  Pickup Complete
                </button>
              )}
            </div>
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

  flowCard: {
    maxWidth: "700px",
    margin: "0 auto 24px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "18px 22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  flowTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#065f46",
    marginBottom: "8px",
  },

  flowList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#475569",
    display: "grid",
    gap: "6px",
    fontSize: "14px",
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

  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },

  statusBadge: (status, currentStatus) => {
    const isActive = status === currentStatus;
    return {
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      border: `1px solid ${statusColors[status]}`,
      color: isActive ? "#ffffff" : statusColors[status],
      background: isActive ? statusColors[status] : "transparent",
      opacity: isActive ? 1 : 0.7,
    };
  },

  statusText: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#475569",
  },

  actions: {
    marginTop: "12px",
  },

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

  buttonDisabled: {
    marginTop: "12px",
    padding: "10px",
    background: "#cbd5f5",
    color: "#475569",
    border: "none",
    borderRadius: "10px",
    cursor: "not-allowed",
    fontWeight: "600",
  },
};
