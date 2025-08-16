import { FiCalendar } from "react-icons/fi";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ManageLeadTable from "../../components/layouts/ManageLeadTable";
import { useState } from "react";
import moment from "moment";

const ManageLead = () => {
  const [selectMonth, setSelectMonth] = useState(() => {
    return (
      sessionStorage.getItem("leadlastMonth") || moment().format("YYYY-MM")
    );
  });
  const [filterTimeframe, setFilterTimeframe] = useState(() => {
    return sessionStorage.getItem("leadlastTimeframe") || "";
  });
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  return (
    <DashboardLayout activeMenu="Manage Lead">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            <h2 className="text-lg text-white md:text-xl font-medium">
              Manage Leads
            </h2>

            <div className="flex items-end gap-4 flex-wrap">
              {/* Timeframe */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Timeframe</label>
                <select
                  value={filterTimeframe}
                  onChange={(e) => setFilterTimeframe(e.target.value)}
                  className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                >
                  <option className="text-white" value="">
                    This Month
                  </option>
                  <option className="text-white" value="today">
                    Today
                  </option>
                  <option className="text-white" value="yesterday">
                    Yesterday
                  </option>
                  <option className="text-white" value="last7days">
                    Last 7 Days
                  </option>
                  <option className="text-white " value="custom">
                    Custom
                  </option>
                </select>
              </div>

              {filterTimeframe === "custom" && (
                <>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">From</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                    />
                  </div>

                  {/* To */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">To</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                    />
                  </div>
                </>
              )}

              {/* Select Month */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectMonth}
                  onChange={(e) => setSelectMonth(e.target.value)}
                  className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                />
              </div>
            </div>

            {/* Time Frame */}
          </div>
        </div>

        <div className="mt-4 w-full">
          <ManageLeadTable
            selectMonth={selectMonth}
            timeframe={filterTimeframe}
            startDate={filterStartDate}
            endDate={filterEndDate}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageLead;
