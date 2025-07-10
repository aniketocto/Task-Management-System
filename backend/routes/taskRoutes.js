const express = require("express");
const { protect, roleCheck } = require("../middlewares/authMiddleware");
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskChecklist,
  updateTaskStatus,
  getDashboardData,
  getUserDashboardData,
} = require("../controllers/taskControllers");

const router = express.Router();

// Dashboard Route
router.get(
  "/dashboard-data",
  protect,
  roleCheck("admin", "superAdmin"),
  getDashboardData
); // All data dashboard for admin

router.get("/user-dashboard-data", protect, getUserDashboardData); // Data Daskboard particular user

// Task Management Route

router.get("/", protect, getTasks); // Get All Tasks (Superadmin, Admin: all, User: only their tasks)

router.get("/:id", protect, getTask); // Get a specific task

router.post(
  "/create-task",
  protect,
  roleCheck("admin", "superAdmin"),
  createTask
); // Create a new task (Admin only)

router.put("/:id", protect, updateTask); // Update a task

router.delete("/:id", protect, roleCheck("admin", "superAdmin"), deleteTask); // Delete a task (Super Admin only)

router.put("/:id/status", protect, updateTaskStatus); // Update task status

router.put("/:id/todo", protect, updateTaskChecklist);

module.exports = router;
