import React, { useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { IoMdNotifications } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

const NotificationBell = () => {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const socketRef = useRef(null);

  const navigate = useNavigate();

  // fetch existing notifications
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

  // real-time socket hookup
  useEffect(() => {
    fetchNotifications();
    const token = localStorage.getItem("taskManagerToken");
    const socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", console.error);
    socket.on("new-notification", (notify) =>
      setNotifications((prev) => [notify, ...prev])
    );

    return () => socket.disconnect();
  }, []);

  // mark all as read & delete immediately
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

  // toggle open/close; if closing, delete immediately
  const handleBellClick = () => {
    if (open) {
      markAllAsReadAndDelete();
    }
    setOpen((o) => !o);
  };


  // close on outside click & delete immediately
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    // return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClick = (taskData) => {
    if (user?.role === "superAdmin") {
      navigate("/admin/create-task", { state: { taskId: taskData } });
      markAllAsReadAndDelete();
    } else {
      navigate(`/user/task-detail/${taskData}`);
      markAllAsReadAndDelete();
    }
  };



  return (
    <div ref={containerRef} className="relative">
      <IoMdNotifications
        onClick={handleBellClick}
        className="text-2xl text-white cursor-pointer"
      />
      {!loading && unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white rounded-full px-1.5">
          {unreadCount}
        </span>
      )}
      {open && (
        <div className="absolute right-0 mt-2 w-64 h-80 border border-gray-50 bg-gray-950 shadow-lg rounded-lg hide-scrollbar overflow-y-auto z-50">
          {loading ? (
            <div className="p-2 text-white">Loading.…</div>
          ) : notifications.length === 0 ? (
            <div className="p-2 text-white">No notifications yet.</div>
          ) : (
            <ul>
              {notifications.map((n, i) => (
                <li
                  key={i}
                  className={`px-3 py-2 text-sm hover:bg-gray-800 cursor-pointer ${
                    !n.isRead ? "font-medium text-white" : "text-gray-400"
                  }`}
                  onClick={() => handleClick(n?.taskId)}
                >
                  <span className="mr-1">{i + 1}.</span>
                  {n.message}
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
