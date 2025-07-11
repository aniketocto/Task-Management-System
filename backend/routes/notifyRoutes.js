const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getUserNotifications,
  markAllAsReadAndDelete,
} = require("../controllers/notifyController");

const router = express.Router();

router.get("/", protect, getUserNotifications);
router.patch("/mark-all-read", protect, markAllAsReadAndDelete);

module.exports = router;
