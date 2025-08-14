import React from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";

// Map category to a color
const CATEGORY_COLORS = {
  realEstate: "#2563EB", 
  hospitality: "#059669", 
  bfsi: "#C2410C", 
  fmcg: "#DC2626", 
  healthcare: "#7C3AED",
  wellness: "#BE185D", 
  fnb: "#0284C7",
  agency: "#22C55E",
  fashion: "#DB2777",
  energy: "#CA8A04", 
  other: "#475569", 
};

// All-caps and spaced utility
const toCapsSpaced = (str = "") =>
  str
    .replace(/([A-Z])/g, " $1") // Add space before caps
    .replace(/^./, (c) => c.toUpperCase()) // First letter cap
    .trim()
    .toUpperCase();

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
        <p className="text-sm font-semibold text-purple-800 mb-1">
          {toCapsSpaced(name)}
        </p>
        <p className="text-sm text-gray-600">
          Leads:{" "}
          <span className="text-gray-900 text-sm font-medium">{value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomContent = (props) => {
  const { x, y, width, height, name, value } = props;
  const color = CATEGORY_COLORS[name] || "#64748b";
  if (width < 40 || height < 30) return null;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} />
      <text
        x={x + width / 2}
        y={y + height / 2 - 2}
        textAnchor="middle"
        fontSize={13}
        fontWeight={400}
        fill="#1e293b"
        style={{ textTransform: "uppercase", letterSpacing: "1.2px" }}
        pointerEvents="none"
        dominantBaseline="middle"
      >
        {toCapsSpaced(name)}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 16}
        textAnchor="middle"
        fontSize={12}
        fill="#374151"
        fontWeight={300}
        pointerEvents="none"
        dominantBaseline="middle"
      >
        {value}
      </text>
    </g>
  );
};

const CustomTreeMap = ({ data }) => {
  const processedData = data.map((item) => ({
    ...item,
    fill: CATEGORY_COLORS[item.name] || "#64748b",
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <Treemap
          data={processedData}
          dataKey="value"
          nameKey="name"
          aspectRatio={4 / 4}
          stroke="#fff"
          content={renderCustomContent}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomTreeMap;
