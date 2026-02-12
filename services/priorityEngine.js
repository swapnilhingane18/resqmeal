const { calculateDistance } = require("../utils/distance");

// weights
const W_URGENCY = 0.35;
const W_DISTANCE = 0.30;
const W_RESPONSE = 0.20;
const W_CAPACITY = 0.15;

const calculateTimeUrgency = (expiresAt) => {
  const now = new Date();
  const minutesLeft = (new Date(expiresAt) - now) / 60000;

  if (minutesLeft <= 0) return 0;
  return 1 / (minutesLeft + 1);
};

const calculateResponseScore = (avgResponseTime) => {
  return 1 / (avgResponseTime + 1);
};

const calculateCapacityScore = (capacity) => {
  if (typeof capacity !== "number" || capacity <= 0) return 0;
  return capacity / (capacity + 1);
};

const calculateScore = (food, ngo) => {
  const timeUrgency = calculateTimeUrgency(food.expiresAt);

  const distance = calculateDistance(food.lat, food.lng, ngo.lat, ngo.lng);
  const distanceScore = 1 / (distance + 1);

  const responseScore = calculateResponseScore(ngo.avgResponseTime);
  const capacityScore = calculateCapacityScore(ngo.capacity);

  return {
    totalScore:
      W_URGENCY * timeUrgency +
      W_DISTANCE * distanceScore +
      W_RESPONSE * responseScore +
      W_CAPACITY * capacityScore,
    timeUrgency,
    distanceScore,
    distance,
    responseScore,
    capacityScore
  };
};

module.exports = { calculateScore };