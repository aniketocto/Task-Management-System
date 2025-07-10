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
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error reading and marking notifications:", error);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
};
