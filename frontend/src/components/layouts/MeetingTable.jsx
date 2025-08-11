import moment from "moment";
import React from "react";

const MeetingTable = ({ data }) => {
  const beautify = (label = "") =>
    label
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letter
      .replace(/[-_]/g, " ") // Replace hyphens/underscores with space
      .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize each word
      .trim();

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "new":
        return "bg-[#FF6900] border border-orange-500";
      case "followUp":
        return "bg-[#f0b100] border border-yellow-500";
      case "dead":
        return "bg-[#FB2C36] border border-red-500";
      case "onboarded":
        return "bg-[#00c950] border border-green-500";
      case "negotiation":
        return "bg-[#615fff] border border-indigo-500";
      case "agreement":
        return "bg-[#2b7fff] border border-blue-500";
      case "pitch":
        return "bg-[#8B5CF6] border border-purple-500";
      case "legal":
        return "bg-[#000] border border-black";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  return (
    <div className="overflow-x-auto overflow-y-auto p-0 rounded-lg mt-3">
      <table className="min-w-full">
        <thead>
          <tr className="text-left">
            <th className="py-3 px-4 text-white bg-red-400 border-b border-gray-500 font-semibold text-[13px] sticky top-0">
              Company
            </th>
            <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
              Meeting type
            </th>
            <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
              Date
            </th>
            <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
              Status
            </th>
            <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0 hidden md:table-cell">
              Service
            </th>
            <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0 hidden md:table-cell">
              Category
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="text-left">
              <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                {item.companyName}
              </td>
              <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                {item.type}
              </td>
              <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                {item.date
                  ? moment(item.date).format("DD-MM-YYYY hh:mm A")
                  : "N/A"}
              </td>
              <td className="py-3 px-4 text-white text-[13px] capitalize border-b border-gray-500">
                <span
                  className={`px-2 py-1 text-sm text-white rounded capitalize inline-block ${getStatusBadgeColor(
                    item.status
                  )}`}
                >
                  {beautify(item.status)}
                </span>
              </td>
              <td className="py-3 px-4 text-white text-[13px] hidden md:table-cell border-b border-gray-500">
                {item.services ? beautify(item.services.join(", ")) : "-"}
              </td>
              <td className="py-3 px-4 text-white text-[13px] hidden md:table-cell border-b border-gray-500">
                {beautify(item.category)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MeetingTable;
