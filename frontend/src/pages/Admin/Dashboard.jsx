import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import React, { useContext, useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { addThousandsSeperator, getGreeting } from "../../utils/helper";
import moment from "moment";
import InfoCard from "../../components/Cards/InfoCard";
import { LuArrowRight } from "react-icons/lu";
import TaskListTable from "../../components/layouts/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import { infoCard } from "../../utils/data";

const Dashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);
  const navigate = useNavigate();


  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  const [filterMonth, setFilterMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

  // Prepare chart Data
  const prepareChartData = (data) => {
    const taskDistribution = data?.taskDistribution || {};
    const taskPriority = data?.taskPrioritiesLevels || {};

    const taskDistributionData = [
      { status: "new", count: taskDistribution?.new || 0 },
      { status: "inProgress", count: taskDistribution?.inProgress || 0 },
      { status: "completed", count: taskDistribution?.completed || 0 },
      { status: "pending", count: taskDistribution?.pending || 0 },
      { status: "delayed", count: taskDistribution?.delayed || 0 },
    ];

    setPieChartData(taskDistributionData);

    const taskPriorityData = [
      { priority: "high", count: taskPriority?.high || 0 },
      { priority: "medium", count: taskPriority?.medium || 0 },
      { priority: "low", count: taskPriority?.low || 0 },
    ];

    setBarChartData(taskPriorityData);
  };

  const getDashboardData = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA);
      if (res.data) {
        setDashboardData(res.data);
        setAvailableMonths(res.data?.monthlyData?.monthsData || []);

        // default: all-time charts
        prepareChartData(res.data?.charts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    getDashboardData();
    return () => {};
  }, []);

  // Filter chart data
  useEffect(() => {
    if (!dashboardData) return;

    if (filterMonth === "") {
      // no month selected → use all-time charts
      prepareChartData(dashboardData?.charts);
    } else {
      const monthData = availableMonths.find((m) => m.value === filterMonth);
      if (monthData?.charts) {
        prepareChartData(monthData.charts);
      } else {
        // fallback in case charts are missing
        prepareChartData(null);
      }
    }
  }, [filterMonth, dashboardData, availableMonths]);

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="card my-5">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl">
                {getGreeting()}! {user?.name}
              </h2>
              <p className="text-sm md:text-[13px] text-gray-400 mt-1.5">
                {moment().format("dddd Do MMM YYYY")}
              </p>
            </div>
            <div className="flex gap-3 mb-4">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border rounded px-3 py-2 text-sm text-gray-700"
              >
                <option value="">All</option>
                {availableMonths
                  .sort((a, b) => b.value.localeCompare(a.value))
                  .map((m) => (
                    <option
                      key={m.value}
                      value={m.value}
                      disabled={m.count === 0}
                    >
                      {m.label} ({m.count})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mt-5">
          {infoCard.map(({ label, key, color }) => {
            const monthData =
              availableMonths.find((m) => m.value === filterMonth)?.charts ||
              dashboardData?.charts;

            return (
              <InfoCard
                key={key}
                label={label}
                value={addThousandsSeperator(
                  monthData?.taskDistribution?.[key] || 0
                )}
                color={color}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        <div>
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Task Distribution</h5>
            </div>

            <CustomPieChart data={pieChartData} />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Task Priority Level</h5>
            </div>

            <CustomBarChart data={barChartData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="text-lg">Recent Task</h5>
              <button className="card-btn" onClick={onSeeMore}>
                View All
                <LuArrowRight className="text-base" />
              </button>
            </div>

            <TaskListTable tableData={dashboardData?.recentTasks || []} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
