const express = require("express");
const router = express.Router();
const {
    getNgoPerformance,
    getSystemOverview,
    getDistrictHeatmap,
    getEscalationMetrics,
    getSlaReport
} = require("../controllers/analytics.controller");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/ngo-performance", protect, authorizeRoles("NGO", "ADMIN"), getNgoPerformance);
router.get("/system-overview", protect, authorizeRoles("NGO", "ADMIN"), getSystemOverview);
router.get("/district-heatmap", protect, authorizeRoles("NGO", "ADMIN"), getDistrictHeatmap);
router.get("/escalation-metrics", protect, authorizeRoles("NGO", "ADMIN"), getEscalationMetrics);
router.get("/sla-report", protect, authorizeRoles("NGO", "ADMIN"), getSlaReport);

module.exports = router;
