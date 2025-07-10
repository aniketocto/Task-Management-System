const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { getUserNotifications, markNotificationAsRead } = require("../controllers/notifyController");

const router = express.Router();

router.get("/", protect, getUserNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);

module.exports = router;