const { differenceInHours } = require("date-fns");

/**
 * @typedef {Object} UrgencyResult
 * @property {number} urgencyScore - 0 to 100
 * @property {string} urgencyLevel - EMERGENCY, CRITICAL, HIGH, WATCH, STABLE
 * @property {number} hoursRemaining - Hours until expiration
 */

const URGENCY_LEVELS = {
    EMERGENCY: { min: 80, label: "EMERGENCY" },
    CRITICAL: { min: 60, label: "CRITICAL" },
    HIGH: { min: 40, label: "HIGH" },
    WATCH: { min: 20, label: "WATCH" },
    STABLE: { min: 0, label: "STABLE" },
};

/**
 * Calculate urgency metrics for a food item
 * @param {Object} food - Food document or object with expiresAt and quantity
 * @returns {UrgencyResult}
 */
const calculateUrgency = (food) => {
    if (!food || !food.expiresAt) {
        return { urgencyScore: 0, urgencyLevel: "STABLE", hoursRemaining: 999 };
    }

    const now = new Date();
    const expiry = new Date(food.expiresAt);
    const hoursRemaining = Math.max(0, (expiry - now) / (1000 * 60 * 60));

    // 1. Time Sensitivity (50%)
    let timeScore = 0;
    if (hoursRemaining <= 2) timeScore = 100;
    else if (hoursRemaining <= 6) timeScore = 80;
    else if (hoursRemaining <= 12) timeScore = 60;
    else if (hoursRemaining <= 24) timeScore = 40;
    else timeScore = 20;

    // 2. Quantity Impact (30%)
    // Normalize quantity: 1 unit -> 0, 50+ units -> 100
    // Simple linear cap
    const quantity = food.quantity || 0;
    let quantityScore = Math.min(100, quantity * 2);

    // 3. Distance Factor (20%) - Placeholder for now as we don't always have user context here
    // If we had a target NGO, we'd calculate this. For general urgency, we might assume 0 or average.
    // Let's assume neutral 50 for now or 0 if strictly item-based.
    // The user prompt said: "Optional distance factor (20%) If NGO list available, penalize if far."
    // Since this is often per-item (without a specific NGO context yet), we'll skip distance or set it to 0
    // and re-normalize, or just calculate score based on Time + Quantity and scale it.

    // Let's stick to the user's formula weights but maybe assume max distance score (best case) 
    // or just ignore it for the "base" urgency.
    // Actually, for "Emergency Rescue", time is paramount.
    // Let's just use Time * 0.6 + Quantity * 0.4 for the Item Score if Distance is missing.

    // WAIT, the prompt formula:
    // urgencyScore = (timeScore * 0.5) + (quantityScore * 0.3) + (distanceScore * 0.2)
    // If no distance, we can just sum the first two? No, that lowers the score.
    // Let's assume Distance Score is 0 (worst case) unless we are matching.
    // OR, effectively re-distribute weights: Time 70%, Quantity 30%.

    // Let's implement the prompt's weights exactly. If distance is unknown, we treat it as 0?
    // "Does NOT store urgency in database." "Computes it dynamically".

    // We will output the score based on available data.
    const distanceScore = 0;

    // Adjusted weights if we want to reach 100 without distance:
    // But let's follow requirements. If distance is missing, maybe the score is just lower.
    // However, if we get < 2 hours, we want EMERGENCY. 
    // 100 * 0.5 = 50. We need 80+ for EMERGENCY.
    // This implies the weights given in prompt might yield low scores without distance.

    // CORRECTION: The prompt says "If NGO list available, penalize if far".
    // This implies if NO NGO list, maybe we don't penalize?
    // Let's adapt logic: If strictly analyzing the ITEM, we focus on Time and Quantity.
    // normalizedUrgency = (timeScore * 0.625) + (quantityScore * 0.375) ??

    // Let's try to be smart. If hoursRemaining < 2, it IS an EMERGENCY regardless of quantity diff.
    // So maybe Time Score alone should be able to trigger Emergency.

    // Let's override: if hoursRemaining < 2, force score to 100.
    // if hoursRemaining < 6, force score to at least 80 (EMERGENCY/CRITICAL boundary).

    let finalScore = (timeScore * 0.5) + (quantityScore * 0.3) + (distanceScore * 0.2);

    // Boost for critical time windows to Ensure accurate labeling
    if (hoursRemaining <= 2) finalScore = Math.max(finalScore, 85); // Force Emergency
    else if (hoursRemaining <= 6) finalScore = Math.max(finalScore, 65); // Force Critical at least

    const formattedHours = Number(hoursRemaining.toFixed(1));
    const roundedScore = Math.round(finalScore);

    let urgencyLevel = URGENCY_LEVELS.STABLE.label;
    if (roundedScore >= URGENCY_LEVELS.EMERGENCY.min) urgencyLevel = URGENCY_LEVELS.EMERGENCY.label;
    else if (roundedScore >= URGENCY_LEVELS.CRITICAL.min) urgencyLevel = URGENCY_LEVELS.CRITICAL.label;
    else if (roundedScore >= URGENCY_LEVELS.HIGH.min) urgencyLevel = URGENCY_LEVELS.HIGH.label;
    else if (roundedScore >= URGENCY_LEVELS.WATCH.min) urgencyLevel = URGENCY_LEVELS.WATCH.label;

    return {
        urgencyScore: roundedScore,
        urgencyLevel,
        hoursRemaining: formattedHours,
    };
};

module.exports = {
    calculateUrgency,
    URGENCY_LEVELS
};
