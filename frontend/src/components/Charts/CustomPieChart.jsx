import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";

// status → color map
const STATUS_COLORS = {
  new: "#1368EC",
  inProgress: "#f0b100",
  completed: "#00C950",
  delayed: "#fb2c36",
  pending: "#00B8DB",
};

const CustomPieChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={325}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={100}
          labelLine={false}
          // label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
          //   const RADIAN = Math.PI / 180;
          //   const radius = innerRadius + (outerRadius - innerRadius) / 2;
          //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
          //   const y = cy + radius * Math.sin(-midAngle * RADIAN);

          //   return (
          //     <text
          //       x={x}
          //       y={y}
          //       fill="#fff"
          //       textAnchor="middle"
          //       dominantBaseline="central"
          //       fontSize={15}
          //       style={{
          //         textShadow: "0 0 2px rgba(0,0,0,0.4)",
          //       }}
          //     >
          //       {value}
          //     </text>
          //   );
          // }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status] || "#cccccc"}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;
