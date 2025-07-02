const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getTasks } = require("../controllers/taskControllers");

const router = express.Router();

// Task Management Route
// router.get("/dashboard-data", protect, adminOnly, getDashboardData); // All data dashboard for admin
// router.get("/user-dashboard-data", protect, adminOnly, getUserDashboardData); // Data Daskboard particular user
router.get("/", protect, getTasks); // Get All Tasks (Admin: all, User: only their tasks)
// router.get("/:id", protect, getTask); // Get a specific task
// router.post("/", protect, adminOnly, createTask); // Create a new task (Admin only)
// router.put("/:id", protect, updateTask); // Update a task
// router.delete("/:id", protect, adminOnly, deleteTask); // Delete a task (Admin only)
// router.put("/:id/status", protect, updateTaskStatus); // Update task status
// router.put("/:id/todo", protect, updateTaskChecklist);

module.exports = router;
