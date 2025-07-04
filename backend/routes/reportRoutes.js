const express = require("express");
const { protect, roleCheck } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/export/tasks", protect, roleCheck("admin", "superAdmin"), exportTasksReport);  // Export all task as Excel file
router.get("/export/users", protect, roleCheck("admin", "superAdmin"), exportUsersReport);  // Export all user as Excel file

module.exports = router;