import React from "react";

const Progress = ({ progress, status }) => {
  const getStatusBadgeColor = () => {
    switch (status) {
      case "inProgress":
        return "bg-yellow-100 text-yellow-600 border border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-500 border border-green-200";
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
