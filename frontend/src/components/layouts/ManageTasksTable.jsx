import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import AvatarGroup from "../../components/layouts/AvatarGroup";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaSort } from "react-icons/fa";
import { HiBellAlert } from "react-icons/hi2";

const PRIORITY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const ManageTasksTable = ({
  allTasks,
  sortOrder,
  sortBy,
  onToggleSort,
  filterPriority,
  onPriorityChange,
  userRole,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (taskData) => {
    if (userRole === "user") {
      navigate(`/user/task-detail/${taskData}`);
    }
    if (userRole === "admin" || userRole === "superAdmin") {
      if (location.pathname === "/admin/tasks") {
        navigate("/admin/create-task", { state: { taskId: taskData } });
      } else {
        navigate(`/user/task-detail/${taskData}`);
      }
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "new":
        return "bg-[#3956E4]  border border-blue-200";
      case "inProgress":
        return "bg-[#E48E39] border border-yellow-200";
      case "completed":
        return "bg-[#6FE439] border border-green-200";
      case "pending":
        return "bg-[#39C5E4] border border-cyan-200";
      case "delayed":
        return "bg-[#E43941] border border-red-200";
      case "All":
        return "bg-[#B439E4] border border-purple-200";
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
    // ── ➊ normalize both to start of day so we compare full calendar days
    const daysLeft = moment(dueDate)
      .startOf("day")
      .diff(moment().startOf("day"), "days");

    if (daysLeft < 0) return "#A9A9A9"; // past due
    if (daysLeft <= 2) return "#E43941"; // 🔴 urgent (0–2 days)
    if (daysLeft <= 4) return "#E48E39"; // 🟠 approaching (3–4 days)
    return "#6FE439"; // 🟢 plenty of time
  };

  // const formattedValue = String(label).replace(/([a-z])([A-Z])/g, "$1-$2");

  return (
    <div className="overflow-x-auto bg-gray-900 rounded-lg shadow-lg p-4">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Title
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Status
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Priority
              <select
                value={filterPriority}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="ml-2 bg-gray-800 text-white text-xs p-1 rounded"
              >
                {PRIORITY_OPTIONS.map(({ label, value }) => (
                  <option key={value} value={value} className="text-white   ">
                    {label}
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
                <FaSort className="ml-1 text-gray-500 opacity-50" /> // ↕️ icon for inactive sort
              )}
            </th>

            <th className="px-4 py-2 text-sm font-semibold text-gray-300">Alert</th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Assigned To
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {allTasks.map((task) => (
            <tr
              key={task._id}
              className="border-b border-gray-800 hover:bg-gray-800"
            >
              <td className="my-2 mx-4 text-[13px]  line-clamp-1 overflow-hidden text-white">
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
              <td className="px-4 py-2 text-white text-[13px] text-nowrap hidden md:table-cell">
                {task.createdAt
                  ? moment(task.createdAt).format("Do MMM YYYY")
                  : "N/A"}
              </td>
              <td className="px-4 py-2 text-white text-[13px] text-nowrap hidden md:table-cell">
                {task.dueDate
                  ? moment(task.dueDate).format("Do MMM YYYY")
                  : "N/A"}
              </td>
              <td className="px-4 py-2 md:table-cell text-2xl">
                <HiBellAlert
                  style={{
                    color: getDueDateColor(task.dueDate),
                  }}
                />
              </td>
              <td className="px-4 py-2">
                <AvatarGroup
                  avatars={task.assignedTo?.map((u) => u.profileImageUrl) || []}
                  maxVisible={3}
                />
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleClick(task._id)}
                  className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white cursor-pointer rounded text-sm"
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
