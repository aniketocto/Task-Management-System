const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
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
  getAdminTasks,
  requestDueDateChange,
  reviewDueDateChange,
  approveTask,
  approveChecklistItem,
  reviewSubTaskDueDateChange,
  requestSubTaskDueDateChange
} = require("../controllers/taskControllers");

const router = express.Router();

// Dashboard Route
router.get(
  "/dashboard-data",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getDashboardData
); // All data dashboard for admin

router.get("/user-dashboard-data", protect, getUserDashboardData); // Data Daskboard particular user

// Task Management Route

router.get("/", protect, getTasks); // Get All Tasks (Superadmin, Admin: all, User: only their tasks)
router.get("/admin-tasks", protect, getAdminTasks); // Get All Tasks (Superadmin, Admin: all, User: only their tasks)

router.get("/:id", protect, getTask); // Get a specific task

router.post(
  "/create-task",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], []),
  createTask
); // Create a new task (Admin only)

router.put("/:id", protect, updateTask); // Update a task

router.delete(
  "/:id",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], []),
  deleteTask
); // Delete a task (Super Admin only)

router.put("/:id/status", protect, updateTaskStatus); // Update task status

router.put("/:id/todo", protect, updateTaskChecklist);

// Due date aprroval apis for admin
router.post(
  "/:id/due-date-request",
  protect,
  allowRoleOrDept(["admin"], []),
  requestDueDateChange
);

// super admin approves or reject due date
router.patch(
  "/:id/due-date-approval",
  protect,
  allowRoleOrDept(["superAdmin"], []),
  reviewDueDateChange
);

// Sub-task due date request (Admin)
router.post(
  "/:id/checklist/:itemId/due-date-request",
  protect,
  allowRoleOrDept(["user", "admin"], []),
  requestSubTaskDueDateChange
);

// Sub-task due date approval (SuperAdmin)
router.patch(
  "/:id/checklist/:itemId/due-date-approval",
  protect,
  allowRoleOrDept(["superAdmin", "admin"], []),
  reviewSubTaskDueDateChange
);

router.patch(
  "/:id/approve",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], []),
  approveTask
);

router.patch(
  "/:id/checklist/:itemId/approve",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], []),
  approveChecklistItem
);

module.exports = router;
