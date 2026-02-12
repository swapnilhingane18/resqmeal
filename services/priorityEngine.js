const { calculateDistance } = require("../utils/distance");

// Weights
const W_DISTANCE = 0.4;
const W_URGENCY = 0.3;
const W_CAPACITY = 0.2;
const W_LOAD = 0.1;

const calculateTimeUrgencyScore = (expiresAt) => {
  const now = new Date();
  const hoursLeft = (new Date(expiresAt) - now) / (1000 * 60 * 60);

  if (hoursLeft < 6) return 100;
  if (hoursLeft < 12) return 70;
  if (hoursLeft < 24) return 40;
  return 10;
};

const calculateDistanceScore = (distance) => {
  // Normalize distance: closer = higher score
  // Assuming max relevant distance approx 20km for local food rescue
  // Formula: 100 * (1 / (1 + distance)) -> decay function 
  // But user asked for "Simple Haversine" (which we have) and "Closer = higher"
  // Let's use a linear decay or simple inverse to map to 0-100
  if (distance <= 0) return 100;
  return Math.min(100, Math.max(0, 100 - (distance * 5))); // -5 points per km, 0 at 20km
};

const calculateCapacityScore = (capacity) => {
  // Higher capacity = higher score. Capped at some reasonable number?
  // Let's assume capacity > 50 is "plenty". 
  return Math.min(100, capacity * 2);
};

const calculateLoadBalanceScore = (activeAssignments) => {
  // Fewer active assignments = boost
  // 0 active -> 100
  // 10 active -> 0
  return Math.max(0, 100 - (activeAssignments * 10));
};

const calculateScore = (food, ngo, activeAssignments = 0) => {
  const distance = calculateDistance(food.lat, food.lng, ngo.lat, ngo.lng);

  const distanceScore = calculateDistanceScore(distance);
  const urgencyScore = calculateTimeUrgencyScore(food.expiresAt);
  const capacityScore = calculateCapacityScore(ngo.capacity);
  const loadBalanceScore = calculateLoadBalanceScore(activeAssignments);

  const totalScore =
    (distanceScore * W_DISTANCE) +
    (urgencyScore * W_URGENCY) +
    (capacityScore * W_CAPACITY) +
    (loadBalanceScore * W_LOAD);

  return {
    totalScore: Number(totalScore.toFixed(2)),
    distanceScore: Number(distanceScore.toFixed(2)),
    urgencyScore,
    capacityScore,
    loadBalanceScore,
    // Legacy/Metadata
    distance: Number(distance.toFixed(2)),
    timeUrgency: urgencyScore, // Map specific score to legacy field if needed
    responseScore: 0 // Deprecated/Not used in new formula
  };
};

module.exports = { calculateScore };