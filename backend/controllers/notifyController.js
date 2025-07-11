const Notifcation = require("../models/Notification");

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notifcation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};
const markAllAsReadAndDelete = async (req, res) => {
  try {
    // Step 1 — Mark all unread as read
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    // Step 2 — Delete all already-read notifications
    const deleted = await Notification.deleteMany({
      user: req.user._id,
      isRead: true,
    });

    res.json({
      message: `${result.modifiedCount} notifications marked as read, ${deleted.deletedCount} read notifications deleted`,
    });
  } catch (error) {
    console.error("Error marking notifications as read and deleting:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAllAsReadAndDelete,
};
