import { FiCalendar } from "react-icons/fi";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ManageLeadTable from "../../components/layouts/ManageLeadTable";
import { useState } from "react";
import moment from "moment";

const ManageLead = () => {
  const [selectMonth, setSelectMonth] = useState(moment().format("YYYY-MM"));

  return (
    <DashboardLayout activeMenu="Manage Lead">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
           <div className="flex w-full items-center justify-between gap-2">
            <h2 className="text-lg text-white md:text-xl font-medium">
              Manage Leads
            </h2>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Select Month:</label>
              <div className="relative w-fit">
                <input
                  type="month"
                  value={selectMonth}
                  onChange={(e) => setSelectMonth(e.target.value)}
                  className="text-white bg-gray-800 border border-gray-600 px-3 py-2 rounded pl-10 focus:outline-none"
                />
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-sm pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full">
          <ManageLeadTable selectMonth={selectMonth} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageLead;
