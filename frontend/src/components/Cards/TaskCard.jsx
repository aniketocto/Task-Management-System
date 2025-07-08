import moment from "moment";
import AvatarGroup from "../layouts/AvatarGroup";
import Progress from "../layouts/Progress";
import { LuPaperclip } from "react-icons/lu";

const TaskCard = ({
  title,
  desc,
  priority,
  status,
  progress,
  createdAt,
  dueDate,
  assignedTo,
  attachmentsCount,
  completedTodoCount,
  todoChecklist,
  onClick,
}) => {
  const getStatusBadgeColor = () => {
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

  const getPriorityBadgeColor = () => {
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
    <div
      className="bg-white rounded-xl py-4 shadow-md shadow-gray-100 border border-gray-200/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-end gap-3 px-4">
        <div
          className={`text-[11px] font-medium ${getStatusBadgeColor()} px-4 py-0.5 rounded-full`}
        >
          {status}
        </div>
        <div
          className={`text-[11px] font-medium ${getPriorityBadgeColor()} px-4 py-0.5 rounded-full`}
        >
          {priority}
        </div>
      </div>

      <div
        className={`px-4 border-l-[3px] ${
          status === "inProgress"
            ? "border-yellow-200"
            : status === "completed"
            ? "border-green-200"
            : status === "new"
            ? "border-blue-200"
            : status === "delayed"
            ? "border-red-200"
            : status === "pending"
            ? "border-cyan-200"
            : "border-gray-200"
        }`}
      >
        <p className="text-sm font-medium text-gray-800 mt-4 line-clamp-2">
          {title}
        </p>
        <p className="text-[13px] text-gray-700 font-medium mt-2 leading-[18px]">
          {desc}
        </p>
        <p className="text-[13px] text-gray-700/80 font-medium mt- mb-2 leading-[18px]">
          Task Done:{" "}
          <span className="font-semibold text-gray-700">
            {completedTodoCount} / {todoChecklist.length || 0}
          </span>
        </p>

        <Progress progress={progress} status={status} />

        <div className="px-4">
          <div className="flex items-center justify-between my-1">
            <div>
              <label className="text-sm text-gray-500">Start Date</label>
              <p className="text-[13px] font-medium text-gray-900">
                {moment(createdAt).format("Do MMM YYYY")}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Due Date</label>
              <p className="text-[13px] font-medium text-gray-900">
                {moment(dueDate).format("Do MMM YYYY")}
              </p>
            </div>
          </div>
        </div>

        <div className="">
          <AvatarGroup avatars={assignedTo || []} maxVisible={3} />

          {attachmentsCount > 0 && (
            <div className="flex items-center gap-2">
              <LuPaperclip />
              <p className="">{attachmentsCount}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
