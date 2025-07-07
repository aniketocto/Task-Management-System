import React from "react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
        <p className="text-sm font-semibold text-purple-800 mb-1">
          {payload[0].name}
        </p>
        <p className="text-sm text-gray-600 ">
          Count:{" "}
          <span className="text-gray-900 text-sm  font-medium">
            {payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
