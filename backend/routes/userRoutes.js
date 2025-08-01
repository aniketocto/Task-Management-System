const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getUsers,
  getUser,
  deleteUser,
  getDepartment,
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

module.exports = router;
