import moment from "moment";
import React from "react";

const TaskListTable = ({ tableData }) => {
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-500 border border-blue-200";
      case "inProgress":
        return "bg-yellow-100 text-yellow-600 border border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-500 border border-green-200";
      case "pending":
        return "bg-cyan-100 text-cyan-500 border border-cyan-200";
      case "delayed":
        return "bg-red-100 text-red-500 border border-red-200";
      case "All":
        return "bg-purple-100 text-purple-500 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-500 border border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-600 border border-orange-200";
      case "low":
        return "bg-green-100 text-green-500 border border-green-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  return (
    <div className="overflow-x-auto p-0 rounded-lg mt-3">
      <table className="min-w-full">
        <thead>
          <tr className="text-left">
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Name</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Status</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Priority</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px] hidden md:table-cell">Created On</th>
            <th className="py-3 px-4 text-gray-800 font-medium text-[13px] hidden md:table-cell">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((task) => (
            <tr key={task._id} className="border-t border-gray-200">
              <td className="my-2 mx-4 text-[13px] line-clamp-1 overflow-hidden">{task.title}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-sm rounded inline-block ${getStatusBadgeColor(
                    task.status
                  )}`}
                >
                  {task.status}
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
              <td className="px-4 py-2 text-gray-700 text-[13px] text-nowrap hidden md:table-cell">
                {task.createdAt
                  ? moment(task.createdAt).format("Do MMM YYYY")
                  : "N/A"}
              </td>
              <td className="px-4 py-2 text-gray-700 text-[13px] text-nowrap hidden md:table-cell">
                {task.dueDate
                  ? moment(task.dueDate).format("Do MMM YYYY")
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListTable;
