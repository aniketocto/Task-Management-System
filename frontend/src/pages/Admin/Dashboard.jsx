import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import {
  addThousandsSeperator,
  findChartsOrFallback,
  getGreeting,
} from "../../utils/helper";
import moment from "moment";
import InfoCard from "../../components/Cards/InfoCard";
import { LuArrowRight } from "react-icons/lu";
import TaskListTable from "../../components/layouts/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import { infoCard, officeQuotes } from "../../utils/data";

const getDailyQuote = () => {
  const today = new Date().toISOString().slice(0, 10);
  const key = Object.keys(officeQuotes);

  const hash =
    today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    key.length;
  return officeQuotes[key[hash]];
};

const Dashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  const [filterMonth, setFilterMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

  const [filterDepartment, setFilterDepartment] = useState(""); // selected dept
  const [departments, setDepartments] = useState([]); // available dept list

  const dailyQuote = useMemo(() => getDailyQuote(), []);

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
        const allDepartments = new Set();

        (res.data?.monthlyData?.monthsData || []).forEach((month) => {
          const deptBreakdown = month.departmentBreakdown || {};
          Object.keys(deptBreakdown).forEach((dept) => {
            allDepartments.add(dept);
          });
        });

        setDepartments(
          Array.from(allDepartments).map((d) => ({ label: d, value: d }))
        );

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

    const chartsToUse = findChartsOrFallback({
      month: filterMonth,
      department: filterDepartment,
      availableMonths,
      dashboardData,
      setFilterMonth,
      setFilterDepartment,
    });

    prepareChartData(chartsToUse);
  }, [filterMonth, filterDepartment, dashboardData, availableMonths]);

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  useEffect(() => {
    if (!filterMonth && availableMonths.length > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. '2025-07'

      const match = availableMonths.find((m) => m.value === currentMonth);
      if (match) {
        setFilterMonth(currentMonth);
      }
    }
  }, [availableMonths]);

  let departmentBreakdown = {};

  // if a month is selected
  if (filterMonth) {
    const monthData = availableMonths.find((m) => m.value === filterMonth);
    if (monthData) {
      departmentBreakdown = monthData.departmentBreakdown || {};
    }
  } else {
    // all-time fallback
    departmentBreakdown = dashboardData?.charts?.departmentDistribution || {};
  }

  const departmentTotals = {};
  Object.entries(departmentBreakdown).forEach(([dept, data]) => {
    departmentTotals[dept] = data.total || 0;
  });

  const chartsToUse =
    findChartsOrFallback({
      month: filterMonth,
      department: filterDepartment,
      availableMonths,
      dashboardData,
      setFilterMonth,
      setFilterDepartment,
    }) || {};

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
              <p className="text-sm text-gray-200 font-semibold mt-1 italic">
                {dailyQuote}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mb-4 items-start flex-col justify-start">
                <label className="text-sm font-medium text-gray-600">
                  Month:
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="border rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">All</option>
                  {availableMonths
                    .sort((a, b) => b.value.localeCompare(a.value))
                    .map((m) => (
                      <option
                        className="text-black"
                        key={m.value}
                        value={m.value}
                        disabled={m.total === 0}
                      >
                        {m.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-1 mb-4 items-start flex-col justify-start">
                <label className="text-sm font-medium text-gray-600">
                  Department:
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="border rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">All</option>
                  {departments
                    .sort((a, b) => b.value.localeCompare(a.value))
                    .map((m) => {
                      const isDisabled =
                        !departmentTotals[m.value] ||
                        departmentTotals[m.value] === 0;
                      return (
                        <option
                          className="text-black"
                          key={m.value}
                          value={m.value}
                          disabled={isDisabled}
                        >
                          {m.label}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mt-5">
          {infoCard.map(({ label, key, color }) => (
            <InfoCard
              key={key}
              label={label}
              value={addThousandsSeperator(
                chartsToUse.taskDistribution?.[key] || 0
              )}
              color={color}
            />
          ))}
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

            <CustomBarChart data={barChartData} dataKey="priority" />
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
