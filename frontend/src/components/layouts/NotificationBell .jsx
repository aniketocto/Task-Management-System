import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { IoMdNotifications } from "react-icons/io";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.NOTIFICATION.GET_NOTIFICATIONS
      );
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsReadAndDelete = async () => {
    try {
      await axiosInstance.patch(API_PATHS.NOTIFICATION.MARK_NOTIFICATION_AS_READ);

      // Refresh the notifications after marking & deleting
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read & delete", err);
    }
  };

  const handleBellClick = () => {
    const nextState = !open;
    setOpen(nextState);

    if (nextState) {
      markAllAsReadAndDelete();
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <IoMdNotifications
        onClick={handleBellClick}
        className="text-2xl text-white cursor-pointer"
      />
      {loading
        ? null
        : unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white rounded-full px-1.5">
              {unreadCount}
            </span>
          )}

      {open && (
        <div className="absolute right-0 mt-2 w-64 border border-gray-50 bg-gray-950 shadow-lg rounded-lg overflow-hidden z-50">
          {loading ? (
            <div className="p-2 text-white">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-2 text-white">No notifications yet.</div>
          ) : (
            <ul>
              {notifications.slice(0, 5).map((n, i) => (
                <li
                  key={n._id}
                  className={`px-3 py-2 text-sm hover:bg-gray-800 ${
                    !n.isRead ? "font-medium text-white" : "text-gray-400"
                  }`}
                >
                  {i + 1}. {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
