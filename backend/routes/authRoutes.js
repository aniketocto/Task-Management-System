const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require("../controllers/authControllers");

const router = express.Router();

// Auth Routes;
router.post("/register", registerUser);  //Reguster User
router.post("/login", loginUser); // Login User
router.get("/profile", protect, getUserProfile) // Get User Profile
router.put("/profile", protect, updateUserProfile) // Update User Profile

module.exports = router;