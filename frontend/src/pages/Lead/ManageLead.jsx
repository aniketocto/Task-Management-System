import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import React, { useState } from "react";
import ManageLeadTable from "../../components/layouts/ManageLeadTable";

const ManageLead = () => {
  return (
    <DashboardLayout activeMenu="Manage Lead">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg text-white md:text-xl font-medium">
              Manage Leads
            </h2>
          </div>
        </div>

        <div className="mt-4 w-full">
          <ManageLeadTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageLead;
