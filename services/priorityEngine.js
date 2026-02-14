const { calculateDistance } = require("../utils/distance");
const { calculateUrgency } = require("./urgency.service");

// Weights
const W_DISTANCE = 0.4;
const W_URGENCY = 0.3; // This aligns with prompt requirements (Time 50% + Quantity 30% ~ Urgency Score) if we map it right
const W_CAPACITY = 0.2;
const W_LOAD = 0.1;

// The prompt asked for:
// urgencyScore = (timeScore * 0.5) + (quantityScore * 0.3) + (distanceScore * 0.2)
// Since we calculate "Urgency Score" separately now (Time + Quantity), 
// we should probably just use that directly as a heavy factor here.

// Let's refine the Priority Logic to TRUST the Urgency Service.
// The Allocation Engine needs to pick the BEST NGO.
// Urgency Score is about the FOOD.
// Distance, Capacity, Load is about the NGO.

// So Total Score = (Urgency of Food) + (Suitability of NGO).
// But Urgency is constant for the food across all NGOs.
// To differentiate NGOs, we rely on Distance, Capacity, Load.

// If we want to prioritize URGENT food, that's done by sorting the queue (Task: "Modify allocation logic to Prioritize food with highest urgencyScore").
// But `calculateScore` is for a specific (Food, NGO) pair.
// We want an NGO that is CLOSE to an URGENT food.

const calculateCapacityScore = (capacity) => {
  return Math.min(100, capacity * 2);
};

const calculateLoadBalanceScore = (activeAssignments) => {
  return Math.max(0, 100 - (activeAssignments * 10));
};

const calculateDistanceScore = (distance) => {
  if (distance <= 0) return 100;
  return Math.min(100, Math.max(0, 100 - (distance * 5)));
};

const calculateScore = (food, ngo, activeAssignments = 0) => {
  const distance = calculateDistance(food.lat, food.lng, ngo.lat, ngo.lng);

  // 1. Get Base Urgency (Time + Quantity)
  const { urgencyScore: baseUrgency } = calculateUrgency(food);

  // 2. NGO Factors
  const distanceScore = calculateDistanceScore(distance);
  const capacityScore = calculateCapacityScore(ngo.capacity);
  const loadBalanceScore = calculateLoadBalanceScore(activeAssignments);

  // 3. Final Weighted Score
  // We want High Urgency to boost the Total Score so this assignment happens?
  // Actually, Assignment happens if we find ANY ngo.
  // The Score is used to pick the BEST NGO among many.

  // If we have an High Urgency item, Distance becomes MORE important (we need it fast!).
  // So maybe dynamic weights?
  // For MVP, let's keep it simple.

  const totalScore =
    (distanceScore * 0.4) +
    (baseUrgency * 0.3) + // Using the new calculated urgency
    (capacityScore * 0.2) +
    (loadBalanceScore * 0.1);

  return {
    totalScore: Number(totalScore.toFixed(2)),
    distanceScore: Number(distanceScore.toFixed(2)),
    urgencyScore: baseUrgency,
    capacityScore,
    loadBalanceScore,
    distance: Number(distance.toFixed(2)),
    timeUrgency: baseUrgency, // Legacy field mapping
    responseScore: 0
  };
};

module.exports = { calculateScore };