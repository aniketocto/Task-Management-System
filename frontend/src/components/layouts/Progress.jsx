import React from "react";

const Progress = ({ progress, status }) => {
  const getStatusBadgeColor = () => {
    switch (status) {
      case "new":
        return "border-[#3956E4] text-cyan-600 border border-[#3956E4]";
      case "inProgress":
        return "bg-[#E48E39] text-yellow-600 border border-[#E48E39]";
      case "completed":
        return "bg-[#6FE439] text-green-500 border border-[#6FE439]";
      case "pending":
        return "bg-[#6FE439] text-green-500 border border-[#6FE439]";
      case "delayed":
        return "bg-[#E43941] text-green-500 border border-[#E43941]";
      case "StartedWork":
        return "bg-[#E48E39] text-yellow-600 border border-[#E48E39]";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  

  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className={`${getStatusBadgeColor()} h-1.5 rounded-full text-center text-xs font-medium`}
        style={{ width: `${progress}%` }}
      >
      </div>
    </div>
  );
};

export default Progress;
