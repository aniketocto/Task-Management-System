const express = require("express");
const { protect, roleCheck } = require("../middlewares/authMiddleware");
const { getUsers, getUser, deleteUser } = require("../controllers/userControllers");

const router = express.Router();

// User Management
router.get("/", protect, roleCheck("admin", "superAdmin"), getUsers);
router.get("/:id", protect, getUser);
router.delete("/:id", protect, roleCheck("superAdmin"), deleteUser);

module.exports = router;