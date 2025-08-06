import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

const CustomBarChart = ({ data, dataKey, valueKey = "count" }) => {
  const getBarColor = (entry) => {
    const keyVal = entry[dataKey];

    if (dataKey === "status") {
      switch (keyVal) {
        case "new":
          return "#FF6900"; // orange
        case "followUp":
          return "#f0b100"; // yellow
        case "dead":
          return "#FB2C36"; // red
        case "onboarded":
          return "#00c950"; // green
        case "agreement":
          return "#2b7fff"; // blue
        case "pitch":
          return "#8B5CF6"; // purple
        case "negotiation":
          return "#615fff"; // purple
        default:
          return "#8884d8"; // fallback gray
      }
    }

    if (dataKey === "priority") {
      // 3️⃣ priority → low/medium/high logic
      switch (keyVal) {
        case "low":
          return "#6FE439";
        case "medium":
          return "#E48E39";
        case "high":
          return "#E43941";
        default:
          return "#22c55e";
      }
    }

    // 4️⃣ any other dataKey? use a generic fallback
    return "#8884d8";
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
        <p className="text-sm font-semibold text-purple-800 mb-1">
          {p[dataKey]}
        </p>
        <p className="text-sm text-gray-600">
          {valueKey}:{" "}
          <span className="text-gray-900 text-sm font-medium">
            {p[valueKey]}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="none" />
          <XAxis
            dataKey={dataKey}
            tick={{
              fontSize: 12,
              fill: "#fff",
              textAnchor: "middle",
            }}
            stroke="#fff"
          />
          {/* <YAxis
            tick={{ fontSize: 12, fill: "#fff" }}
            stroke="#fff"
          /> */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />

          <Bar
            dataKey={valueKey}
            nameKey={dataKey}
            radius={[10, 10, 0, 0]}
            fill="#8884d8"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
