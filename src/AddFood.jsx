import { useState } from "react";

export default function AddFood({ onSubmit }) {
  const [food, setFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const foodData = {
      food,
      quantity,
      time,
      location,
    };

    console.log("Food Posted:", foodData);
    onSubmit();
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🍱 Add Surplus Food</h2>

      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          style={styles.input}
          placeholder="Food description (e.g. Rice & Dal)"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="number"
          placeholder="Quantity (people served)"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <input
          style={styles.input}
          placeholder="Pickup location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <button style={styles.button}>Post Food</button>
      </form>
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
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#065f46",
  },

  form: {
    background: "#ffffff",
    padding: "32px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },

  button: {
    marginTop: "12px",
    padding: "12px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
