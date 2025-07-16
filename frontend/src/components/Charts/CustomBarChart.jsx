import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CustomBarChart = ({ data }) => {
  // Function to alternate colors
  const getBarColor = (entry) => {
    switch (entry?.priority) {
      case "low":
        return "#6FE439"; // Green
      case "medium":
        return "#E48E39"; // Yellow
      case "high":
        return "#E43941"; // Red
      default:
        return "#22c55e"; // Default to green
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
          <p className="text-sm font-semibold text-purple-800 mb-1">
            {payload[0].payload.priority}
          </p>
          <p className="text-sm text-gray-600 ">
            Count:{" "}
            <span className="text-gray-900 text-sm font-medium">
              {payload[0].payload.count}
            </span>
          </p>
        </div>
      );
    }
  };
  

  return (
    <div className=" mt-6 ">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="none" />

          <XAxis
            dataKey="priority"
            tick={{ fontSize: 12, fill: "#fff" }}
            stroke="#fff"
          />
          {/* <YAxis tick={{ fontSize: 12, fill: "#fff" }} stroke="#fff"  /> */}
          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="count"
            nameKey="priority"
            fill="#ff8042"
            radius={[10, 10, 0, 0]}
            activeDot={{ r: 8, fill: "yellow" }}
            activeStyle={{ fill: "green" }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
