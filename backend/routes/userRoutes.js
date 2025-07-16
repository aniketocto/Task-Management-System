const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getUsers,
  getUser,
  deleteUser,
} = require("../controllers/userControllers");

const router = express.Router();

// User Management
router.get(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], []),
  getUsers
);
router.get("/:id", protect, getUser);
router.delete("/:id", protect, allowRoleOrDept(["superAdmin"], []), deleteUser);

module.exports = router;
