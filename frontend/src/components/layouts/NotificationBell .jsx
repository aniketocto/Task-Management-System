import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { IoMdNotifications } from "react-icons/io";
import { useNavigate } from "react-router-dom";


const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const socketRef = useRef(null);

  // fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.NOTIFICATION.GET_NOTIFICATIONS
      );
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // connect socket once
  useEffect(() => {
    const token = localStorage.getItem("taskManagerToken");

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
    });
    socket.on("new-notification", (notify) => {
      setNotifications((prev) => [notify, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // mark & delete on server
  const markAllAsReadAndDelete = async () => {
    setLoading(true);
    try {
      await axiosInstance.patch(
        API_PATHS.NOTIFICATION.MARK_NOTIFICATION_AS_READ
      );
      const { data } = await axiosInstance.get(
        API_PATHS.NOTIFICATION.GET_NOTIFICATIONS
      );
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // toggle dropdown; if closing, then delete
  const handleBellClick = () => {
    if (open) {
      markAllAsReadAndDelete();
    }
    setOpen((prev) => !prev);
  };

  // navigate to task
  const handleNavigate = (taskId) => {
    setOpen(false);
    navigate(`/user/task-detail/${taskId}`);
  };

  // initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        markAllAsReadAndDelete(); // optional: delete on outside close too
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div ref={containerRef} className="relative">
      <IoMdNotifications
        onClick={handleBellClick}
        className="text-2xl text-white cursor-pointer"
      />
      {/* badge */}
      {!loading && unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white rounded-full px-1.5">
          {unreadCount}
        </span>
      )}

      {/* dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 border border-gray-50 bg-gray-950 shadow-lg rounded-lg overflow-hidden z-50">
          {loading ? (
            <div className="p-2 text-white">Loading…</div>
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
                  <span className="mr-1">{i + 1}.</span>
                  <span
                    onClick={() => handleNavigate(n.taskId)}
                    className="cursor-pointer"
                  >
                    {n.message}
                  </span>
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
