const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getUsers,
  getUser,
  deleteUser,
  getDepartment,
  transferAdminTasks,
} = require("../controllers/userControllers");

const router = express.Router();

// User Management
router.get(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], []),
  getUsers
);
router.get("/department", protect, getDepartment);
router.get("/:id", protect, getUser);
router.delete("/:id", protect, allowRoleOrDept(["superAdmin"], []), deleteUser);
router.post(
  "/:adminId/transfer-tasks",
  protect,
  allowRoleOrDept(["superAdmin"], []),
  transferAdminTasks
);

module.exports = router;
