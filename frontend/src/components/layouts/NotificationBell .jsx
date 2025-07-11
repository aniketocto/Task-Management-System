import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { IoMdNotifications } from "react-icons/io";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const socketRef = useRef(null);

  const deleteTimeoutRef = useRef(null);

  // Helper: schedule a deletion 20 minutes from now
  const scheduleDelete = () => {
    // clear any existing timer
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    deleteTimeoutRef.current = setTimeout(() => {
      markAllAsReadAndDelete();
      deleteTimeoutRef.current = null;
    }, 20 * 60 * 1000); // 20 minutes
  };

  // Helper: cancel a pending deletion
  const cancelScheduledDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
  };

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

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      // we’re closing it → schedule a deletion
      scheduleDelete();
    } else {
      // we’re opening it → cancel any pending deletion
      cancelScheduledDelete();
    }
    setOpen((prev) => !prev);
  };

  // Close on outside click, but only “close” (scheduling happens in handleBellClick)
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        // close dropdown
        setOpen(false);
        // and schedule deletion
        scheduleDelete();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Cleanup on unmount
  useEffect(() => () => cancelScheduledDelete(), []);

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
        <div className="absolute right-0 mt-2 w-64 h-80 border border-gray-50 bg-gray-950 shadow-lg rounded-lg  hide-scrollbar overflow-y-scroll z-50">
          {loading ? (
            <div className="p-2 text-white">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-2 text-white">No notifications yet.</div>
          ) : (
            <ul>
              {notifications.map((n, i) => (
                <li
                  key={n._id}
                  className={`px-3 py-2 text-sm hover:bg-gray-800 ${
                    !n.isRead ? "font-medium text-white" : "text-gray-400"
                  }`}
                >
                  <span className="mr-1">{i + 1}.</span>
                  <span className="cursor-pointer">{n.message}</span>
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
