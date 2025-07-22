import moment from "moment";
import React from "react";
import { HiBellAlert } from "react-icons/hi2";

const TaskListTable = ({ tableData }) => {
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

  return (
    <div className="overflow-x-auto p-0 rounded-lg mt-3">
      <table className="min-w-full">
        <thead>
          <tr className="text-left">
            <th className="py-3 px-4 text-white font-semibold text-[13px]">
              Title
            </th>
            <th className="py-3 px-4 text-white font-semibold text-[13px]">
              Status
            </th>
            <th className="py-3 px-4 text-white font-semibold text-[13px]">
              Priority
            </th>
            <th className="py-3 px-4 text-white font-semibold text-[13px] hidden md:table-cell">
              Created On
            </th>
            <th className="py-3 px-4 text-white font-semibold text-[13px] hidden md:table-cell">
              Due Date
            </th>
            <th className="px-4 py-2 text-sm font-semibold text-gray-300">Alert</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((task) => (
            <tr key={task._id} className="border-t border-gray-200">
              <td className="my-2 mx-4 text-[13px] line-clamp-1 overflow-hidden">
                {task.title}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-sm capitalize rounded inline-block ${getStatusBadgeColor(
                    task.status
                  )}`}
                >
                  {String(task.status).replace(/([a-z])([A-Z])/g, "$1-$2")}
                </span>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-sm rounded inline-block ${getPriorityBadgeColor(
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListTable;
