import moment from "moment";
import AvatarGroup from "../layouts/AvatarGroup";
import Progress from "../layouts/Progress";
import { LuPaperclip } from "react-icons/lu";

const TaskCard = ({
  title,
  desc,
  company,
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
        return "bg-blue-100 text-[#3956E4] border border-blue-200";
      case "inProgress":
        return "bg-yellow-100 text-[#E48E39] border border-yellow-200";
      case "completed":
        return "bg-green-100 text-[#6FE439] border border-green-200";
      case "pending":
        return "bg-cyan-100 text-[#39C5E4] border border-cyan-200";
      case "delayed":
        return "bg-red-100 text-[#E43941] border border-red-200";
      case "All":
        return "bg-purple-100 text-[#B439E4] border border-purple-200";
      case "working":
        return "bg-orange-100 text-[#E4ca39] border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  const getPriorityBadgeColor = () => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-[#E43941] border border-red-200";
      case "medium":
        return "bg-orange-100 text-[#E48E39] border border-orange-200";
      case "low":
        return "bg-green-100 text-[#6FE439] border border-green-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  return (
    <div
      className="bg-gray-950 shadow-lg shadow-black/50 border border-gray-200 rounded-xl py-4  cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-end gap-3 px-4">
        <div
          className={`text-[11px] font-medium ${getStatusBadgeColor()} uppercase px-4 py-0.5 rounded-full`}
        >
          {status}
        </div>
        <div
          className={`text-[11px] font-medium ${getPriorityBadgeColor()} px-4 py-0.5 uppercase rounded-full`}
        >
          {priority} Priority
        </div>
      </div>

      <div
        className={`px-4 border-l-[3px] ${
          status === "inProgress"
            ? "border-[#E48E39]"
            : status === "completed"
            ? "border-[#6FE439]"
            : status === "new"
            ? "border-[#3956E4]"
            : status === "delayed"
            ? "border-[#E43941]"
            : status === "pending"
            ? "border-[#39C5E4]"
            : "border-gray-200"
        }`}
      >
        <p className="text-sm font-medium text-gray-50 mt-4 line-clamp-2">
          {company}
        </p>
        <p className="text-sm font-medium text-gray-50 mt-2 line-clamp-2">
          {title}
        </p>
        <p className="text-[13px] text-gray-100 font-medium  leading-[18px]">
          {desc}
        </p>
        <p className="text-[13px] text-gray-200 font-medium mt-3 mb-2 leading-[18px]">
          Task Done:{" "}
          <span className="font-semibold text-gray-300">
            {completedTodoCount} / {todoChecklist.length || 0}
          </span>
        </p>

        <Progress progress={progress} status={status} />

        <div className="py-4">
          <div className="flex items-start justify-between my-1">
            <div>
              <label className="text-sm text-gray-500">Start Date</label>
              <p className="text-[13px] font-medium text-white">
                {moment(createdAt).format("Do MMM YYYY")}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Due Date</label>
              <p className="text-[13px] font-medium text-white">
                {moment(dueDate).format("Do MMM YYYY")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
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
