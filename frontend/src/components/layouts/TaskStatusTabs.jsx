import React from "react";

const TaskStatusTabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="my-2">
      <label className="text-sm font-medium text-gray-600 mr-2">Status:</label>
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="px-3 py-2 text-sm border rounded-md text-gray-700"
      >
        {tabs.map((tab, index) => (
          <option key={index} value={tab.label} disabled={tab.count === 0}>
            {tab.label} 
          </option>
        ))}
      </select>
    </div>
  );
};

export default TaskStatusTabs;
