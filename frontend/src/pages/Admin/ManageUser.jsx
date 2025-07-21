import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import UserCard from "../../components/Cards/UserCard";

const ManageUser = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS, {
        params: {
          month: filterMonth || undefined,
        },
      });

      if (response.data?.length > 0) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getAvailableMonths = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: { page: 1, limit: 1 },
      });
      setAvailableMonths(data?.monthlyData?.monthsData || []);
    } catch (error) {
      console.error("Error fetching monts:", error);
    }
  };

  // const handleUserDownloadReports = async () => {};

  useEffect(() => {
    getAllUsers();
    getAvailableMonths();
  }, [filterMonth]);


  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="mt-5 mb-10">
        <div className="flex md:flex-row md:items-center justify-between">
          <h2 className="text-2xl md:text-xl font-medium text-gray-50">
            Team Members
          </h2>

          {/* Month filter */}
          {availableMonths.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-50">Month:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border rounded px-3 py-1 text-sm text-gray-50"
              >
                <option value="">All Months</option>
                {[...availableMonths]
                  .sort((a, b) => b.value.localeCompare(a.value)) // latest first
                  .map((m) => (
                    <option key={m.value} value={m.value} className="text-gray-600">
                      {m.label}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-6">
          {Object.entries(
            allUsers.reduce((acc, user) => {
              const dept = user.department || "No Department";
              if (!acc[dept]) acc[dept] = [];
              acc[dept].push(user);
              return acc;
            }, {})
          ).map(([department, users]) => (
            <div
              key={department}
              className="border border-gray-200 rounded-md p-4"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                {department}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {users.map((user) => (
                  <UserCard key={user._id} userInfo={user} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageUser;
