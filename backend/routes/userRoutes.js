const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getUsers, getUser, deleteUser } = require("../controllers/userControllers");

const router = express.Router();

// User Management
router.get("/", protect, adminOnly, getUsers); // Get All Users (Admin only)
router.get("/:id", protect, getUser); // Get a secifuc user
router.delete("/:id", protect, adminOnly, deleteUser); // Delete a user (Admin only)

module.exports = router;