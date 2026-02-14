const { runEmergencyScan } = require("../services/emergencyScan.service");

// Trigger manual emergency scan
const triggerScan = async (req, res, next) => {
    try {
        const result = await runEmergencyScan();

        return res.status(200).json({
            message: "Emergency scan completed successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    triggerScan
};
