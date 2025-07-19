import React from "react";

const TaskStatusTabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="my-2">
      <label className="text-sm font-medium text-gray-600 mr-2">Status:</label>
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="px-3 py-2 text-sm border capitalize rounded-md text-gray-50"
      >
        {tabs.map((tab, index) => (
          <option key={index} value={tab.label} disabled={tab.count === 0} className={`${tab.count === 0 ? "text-gray-200" : "text-gray-600"} capitalize`}>
            {String(tab.label).replace(/([a-z])([A-Z])/g, "$1-$2")}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TaskStatusTabs;
