import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import AvatarGroup from "../../components/layouts/AvatarGroup";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaSort } from "react-icons/fa";
import { HiBellAlert } from "react-icons/hi2";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuCheck, LuX } from "react-icons/lu";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem("taskManagerToken") },
  transports: ["websocket"], // skip HTTP polling
  withCredentials: true,
});

const PRIORITY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Delayed", value: "delayed" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "inProgress" },
  { label: "Completed", value: "completed" },
];

const ManageTasksTable = ({
  allTasks,
  sortOrder,
  sortBy,
  onToggleSort,
  filterPriority,
  filterStatus,
  onStatusChange,
  onPriorityChange,
  userRole,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = userRole === "superAdmin";

  const [tasks, setTasks] = useState(allTasks || []);
  useEffect(() => {
    setTasks(allTasks || []);
  }, [allTasks]);

  useEffect(() => {
    socket.on("task:sync", () => {
      setTasks(allTasks || []);
      console.log("task:sync");
    });

    return () => {
      socket.off("task:sync"); // clean up
    };
  }, [allTasks]);

  const handleClick = (id) => {
    if (userRole === "user") navigate(`/user/task-detail/${id}`);
    else if (userRole === "admin" || isSuperAdmin) {
      if (location.pathname === "/admin/tasks")
        navigate("/admin/create-task", { state: { taskId: id } });
      else navigate(`/user/task-detail/${id}`);
    }
  };

  const handleApprovalToggle = async (taskId, type, status) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, [type]: { status } } : t))
    );
    try {
      await axiosInstance.patch(API_PATHS.APPROVAL.TASK_APPROVAL(taskId), {
        type,
        status,
      });
      setTasks((prev) =>
        prev.map((t) => {
          if (t._id !== taskId) return t;
          const sup =
            type === "superAdminApproval"
              ? status
              : t.superAdminApproval?.status;
          const cli =
            type === "clientApproval" ? status : t.clientApproval?.status;
          if (
            sup === "approved" &&
            cli === "approved" &&
            allSubTasksApproved(t)
          ) {
            return { ...t, status: "completed" };
          }
          return t;
        })
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, [type]: { status: t[type]?.status } } : t
        )
      );
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "new":
        return "bg-[#3956E4] border border-blue-200";
      case "inProgress":
        return "bg-[#E48E39] border border-yellow-200";
      case "completed":
        return "bg-[#6FE439] border border-green-200";
      case "pending":
        return "bg-[#39C5E4] border border-cyan-200";
      case "delayed":
        return "bg-[#E43941] border border-red-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-[#E43941] border border-red-200";
      case "medium":
        return "bg-[#E48E39] border border-orange-200";
      case "low":
        return "bg-[#6FE439] border border-green-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return "#D3D3D3";
    const daysLeft = moment(dueDate)
      .startOf("day")
      .diff(moment().startOf("day"), "days");
    if (daysLeft < 0) return "#A9A9A9";
    if (daysLeft <= 2) return "#E43941";
    if (daysLeft <= 4) return "#E48E39";
    return "#6FE439";
  };

  const allSubTasksApproved = (task) => {
    const list = task.todoChecklist || [];
    return (
      list.length > 0 &&
      list.every((item) => item.approval?.status === "approved")
    );
  };
  const renderApprovalControls = (
    approvalObj,
    task,
    type,
    userRole,
    handleApprovalToggle
  ) => {
    const status = approvalObj?.status || "pending";
    const disable = userRole !== "superAdmin" || !allSubTasksApproved(task);
    if (status === "pending") {
      return userRole !== "superAdmin" ? (
        <p className="text-gray-500 text-sm">Pending</p>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disable}
            onClick={() => handleApprovalToggle(task._id, type, "approved")}
            className={`${
              disable
                ? "text-gray-400 cursor-not-allowed"
                : "text-green-500 hover:text-green-700 cursor-pointer"
            } p-1 border rounded`}
          >
            <LuCheck size={18} />
          </button>
          <button
            type="button"
            disabled={disable}
            onClick={() => handleApprovalToggle(task._id, type, "rejected")}
            className={`${
              disable
                ? "text-gray-400 cursor-not-allowed"
                : "text-red-500 hover:text-red-700 cursor-pointer"
            } p-1 border rounded`}
          >
            <LuX size={18} />
          </button>
        </div>
      );
    }
    return status === "approved" ? (
      <button
        type="button"
        disabled={disable}
        onClick={() => handleApprovalToggle(task._id, type, "rejected")}
        className={`${
          disable ? "cursor-not-allowed" : " cursor-pointer"
        } text-green-500 border rounded p-1`}
      >
        <LuCheck size={18} />
      </button>
    ) : (
      <button
        type="button"
        disabled={disable}
        onClick={() => handleApprovalToggle(task._id, type, "approved")}
        className={`${
          disable ? "cursor-not-allowed" : " cursor-pointer"
        }  text-red-500 border rounded p-1`}
      >
        <LuX size={18} />
      </button>
    );
  };

  return (
    <div className="overflow-x-auto bg-gray-900 rounded-lg shadow-lg">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Sr. No
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Company
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Task
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Status
              <select
                value={filterStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="ml-2 bg-gray-800 text-white text-xs p-1 rounded"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Priority
              <select
                value={filterPriority}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="ml-2 bg-gray-800 text-white text-xs p-1 rounded"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </th>
            <th
              className="px-4 py-2 text-sm font-semibold text-gray-300"
              onClick={onToggleSort}
            >
              Created At
            </th>
            <th
              className="px-4 py-2 text-sm font-semibold text-gray-300 cursor-pointer flex items-center h-[43px]"
              onClick={onToggleSort}
            >
              Due Date
              {sortBy === "dueDate" ? (
                sortOrder === "desc" ? (
                  <FiChevronDown className="ml-1 text-gray-400" />
                ) : (
                  <FiChevronUp className="ml-1 text-gray-400" />
                )
              ) : (
                <FaSort className="ml-1 text-gray-500 opacity-50" />
              )}
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Alert
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Assigned To
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Management
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Client
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task._id}
              className="border-b border-gray-800 hover:bg-gray-800"
            >
              <td className="px-4 py-2 text-white text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                {task.serialNumber}
              </td>
              <td className="px-4 py-2 text-white text-[13px] overflow-hidden text-ellipsis max-w-[160px]">
                {task.companyName}
              </td>
              <td className="px-4 py-2 text-white text-[13px] overflow-hidden text-ellipsis max-w-[160px]">
                {task.title}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-sm text-white rounded capitalize inline-block ${getStatusBadgeColor(
                    task.status
                  )}`}
                >
                  {String(task.status).replace(/([a-z])([A-Z])/g, "$1-$2")}
                </span>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-sm rounded text-white inline-block ${getPriorityBadgeColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-2 text-white text-[13px] table-cell">
                {task.createdAt
                  ? moment(task.createdAt).format("Do MMM YYYY")
                  : "N/A"}
              </td>
              <td className="px-4 py-2 text-white text-[13px] table-cell">
                {task.dueDate
                  ? moment(task.dueDate).format("Do MMM YYYY")
                  : "N/A"}
              </td>
              <td className="px-4 py-2 md:table-cell text-2xl">
                <HiBellAlert style={{ color: getDueDateColor(task.dueDate) }} />
              </td>
              <td className="px-4 py-2">
                <AvatarGroup
                  avatars={
                    task.assignedTo?.map((u) => ({
                      name: u.name,
                      profileImageUrl: u.profileImageUrl,
                    })) || []
                  }
                  maxVisible={3}
                />
              </td>
              <td className="px-4 py-2">
                {renderApprovalControls(
                  task.superAdminApproval,
                  task,
                  "superAdminApproval",
                  userRole,
                  handleApprovalToggle
                )}
              </td>
              <td className="px-4 py-2">
                {renderApprovalControls(
                  task.clientApproval,
                  task,
                  "clientApproval",
                  userRole,
                  handleApprovalToggle
                )}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleClick(task._id)}
                  className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageTasksTable;
