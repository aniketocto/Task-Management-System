import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import {
  addThousandsSeperator,
  findChartsOrFallback,
  getGreeting,
  getInfoCardChartData,
} from "../../utils/helper";
import moment from "moment";
import InfoCard from "../../components/Cards/InfoCard";
import { LuArrowRight } from "react-icons/lu";
import TaskListTable from "../../components/layouts/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";
import { infoCard, officeQuotes } from "../../utils/data";
import SpinLoader from "../../components/layouts/SpinLoader";
import { io } from "socket.io-client";
import { userSOPs } from "../../utils/userSOPs";
import DailySOP from "components/Inputs/DailySOP";
import { RiResetLeftLine } from "react-icons/ri";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem("taskManagerToken") },
  transports: ["websocket"], // skip HTTP polling
  withCredentials: true,
});

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

  // Month init respects timeframe precedence in UI on refresh
  const [filterMonth, setFilterMonth] = useState(() => {
    const ssTf = sessionStorage.getItem("dashlastTimeframe") || "";
    if (ssTf) return ""; // if timeframe exists, start with month cleared for UI parity
    return sessionStorage.getItem("dashlastmonth") || "";
  });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterDepartment, setFilterDepartment] = useState(() => {
    return sessionStorage.getItem("dashlastdept") || "";
  });
  useEffect(() => {
    sessionStorage.setItem("dashlastdept", filterDepartment);
  }, [filterDepartment]);
  const [departments, setDepartments] = useState([]);

  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return sessionStorage.getItem("dashlastCompany") || "";
  });
  useEffect(() => {
    sessionStorage.setItem("dashlastCompany", selectedCompany);
  }, [selectedCompany]);

  const [filterTimeframe, setFilterTimeframe] = useState(() => {
    return sessionStorage.getItem("dashlastTimeframe") || "";
  });
  useEffect(() => {
    sessionStorage.setItem("dashlastTimeframe", filterTimeframe);
  }, [filterTimeframe]);

  const [selectedUserId, setSelectedUserId] = useState(
    () => sessionStorage.getItem("dashlastUser") || ""
  );
  useEffect(() => {
    sessionStorage.setItem("dashlastUser", selectedUserId);
  }, [selectedUserId]);

  const [availableUsers, setAvailableUsers] = useState([]);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const userEmail = user.email;
  const sops = userSOPs[userEmail] || [];

  // Stable list of departments across loads (persist to session)
  const [departmentsMaster, setDepartmentsMaster] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dashDeptMaster") || "[]");
    } catch {
      return [];
    }
  });

  // debounce ref
  const debounceTimeout = useRef();

  // ✅ Hydration guard so mount-time effects don’t nuke session-restored values
  const hydrated = useRef(false);
  useEffect(() => {
    hydrated.current = true;
  }, []);

  // MUTUALLY EXCLUSIVE filters: only one of month or timeframe should be active
  // (guarded so they don't run on the first mount)
  useEffect(() => {
    if (!hydrated.current) return;
    if (filterTimeframe) setFilterMonth("");
    if (filterTimeframe !== "custom") {
      setFilterStartDate("");
      setFilterEndDate("");
    }
  }, [filterTimeframe]);
  useEffect(() => {
    if (!hydrated.current) return;
    if (filterMonth) {
      setFilterTimeframe("");
      setFilterStartDate("");
      setFilterEndDate("");
    }
  }, [filterMonth]);

  // Prepare chart Data
  const prepareChartData = useCallback((data) => {
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
  }, []);

  // Fetch company list for dropdown
  const fetchCompanies = useCallback(async () => {
    try {
      const resp = await axiosInstance.get(API_PATHS.COMPANY.GET_COMPANY);
      setAvailableCompanies(resp.data || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  }, []);

  // Main dashboard API call, only sends valid params
  const getDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      // Only send one of these
      if (filterTimeframe) {
        params.timeframe = filterTimeframe;
        if (filterTimeframe === "custom") {
          if (filterStartDate && filterEndDate) {
            params.startDate = filterStartDate;
            params.endDate = filterEndDate;
          } else {
            setLoading(false);
            return; // skip call if custom range incomplete
          }
        }
      } else if (filterMonth) {
        params.month = filterMonth;
      }
      if (filterDepartment) params.department = filterDepartment;
      if (selectedCompany) params.companyName = selectedCompany;
      if (user?.role === "superAdmin" && selectedUserId) {
        params.userId = selectedUserId;
      }

      const res = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA, {
        params,
      });

      if (res.data) {
        setDashboardData(res.data);
        setAvailableMonths(res.data?.monthlyData?.monthsData || []);

        // Collect departments from the *current* payload (unfiltered by dept)
        const allDepartmentsFromPayload = new Set();
        (res.data?.monthlyData?.monthsData || []).forEach((month) => {
          const deptBreakdown = month.departmentBreakdown || {};
          Object.keys(deptBreakdown).forEach((d) =>
            allDepartmentsFromPayload.add(d)
          );
        });

        // If we don't have a master yet, or if no Department filter applied,
        // refresh master with the union of current payload depts.
        if (departmentsMaster.length === 0 || !filterDepartment) {
          const master = Array.from(
            new Set([
              ...(departmentsMaster || []),
              ...Array.from(allDepartmentsFromPayload),
            ])
          );
          setDepartmentsMaster(master);
          sessionStorage.setItem("dashDeptMaster", JSON.stringify(master));
        }

        // Always render dropdown from the master to avoid vanishing options
        const source = departmentsMaster.length
          ? departmentsMaster
          : Array.from(allDepartmentsFromPayload);
        setDepartments(source.map((d) => ({ label: d, value: d })));

        prepareChartData(res.data?.charts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setDashboardData,
    setAvailableMonths,
    setDepartments,
    prepareChartData,
    selectedCompany,
    filterDepartment,
    filterMonth,
    filterTimeframe,
    filterStartDate,
    filterEndDate,
    selectedUserId,
    user?.role,
    departmentsMaster,
  ]);

  // Debounced API trigger
  const safeGetDashboardData = useCallback(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      getDashboardData();
    }, 300);
  }, [getDashboardData]);

  // On mount, fetch companies and initial dashboard
  useEffect(() => {
    fetchCompanies();
    getDashboardData();
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
    // eslint-disable-next-line
  }, []);

  // Save filterMonth to sessionStorage when it changes
  useEffect(() => {
    if (filterMonth) {
      sessionStorage.setItem("dashlastmonth", filterMonth);
    }
  }, [filterMonth]);

  // Choose which charts to render whenever data or filters change
  useEffect(() => {
    if (!dashboardData) return;

    let chartsToUse = dashboardData?.charts;

    if (filterMonth) {
      // Prefer month-scoped charts
      const viaHelper = findChartsOrFallback({
        month: filterMonth,
        department: filterDepartment,
        availableMonths,
        dashboardData,
        setFilterMonth,
        setFilterDepartment,
      });
      chartsToUse = viaHelper || chartsToUse;
    } else if (filterDepartment) {
      // Only department selected → try department-scoped charts first
      const depCharts =
        dashboardData?.charts?.departmentDistribution?.[filterDepartment]
          ?.charts;
      chartsToUse = depCharts || chartsToUse;
    }

    prepareChartData(chartsToUse);
  }, [
    filterMonth,
    filterDepartment,
    dashboardData,
    availableMonths,
    prepareChartData,
  ]);

  // Department filter reset — only after totals exist
  let departmentBreakdown = {};
  if (filterMonth) {
    const monthData = availableMonths.find((m) => m.value === filterMonth);
    if (monthData) {
      departmentBreakdown = monthData.departmentBreakdown || {};
    }
  } else {
    departmentBreakdown = dashboardData?.charts?.departmentDistribution || {};
  }
  const departmentTotals = {};
  Object.entries(departmentBreakdown).forEach(([dept, data]) => {
    departmentTotals[dept] = data.total || 0;
  });
  const departmentTotalsReady = Object.keys(departmentTotals || {}).length > 0;

  useEffect(() => {
    if (!departmentTotalsReady) return; // wait until we have real totals
    if (filterMonth) {
      const count = departmentTotals[filterDepartment] || 0;
      if (count === 0) setFilterDepartment("");
    }
  }, [departmentTotalsReady, filterMonth, filterDepartment, departmentTotals]);

  // Live socket update
  useEffect(() => {
    socket.on("task:sync", () => {
      getDashboardData();
    });
    return () => {
      socket.off("task:sync");
    };
  }, [getDashboardData]);

  // See More
  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  const infoCardData = getInfoCardChartData({
    dashboardData,
    filterMonth,
    filterDepartment,
  });

  // Build & filter users from API payload
  useEffect(() => {
    // `userBreakdown` comes from the dashboard API; keys are user IDs
    const raw = dashboardData?.userBreakdown || {};
    let list = Object.entries(raw).map(([id, u]) => ({
      _id: id,
      name: u.name,
      department: u.department,
      total: u.total || 0,
    }));

    // If a Department is selected, limit users to that department (superAdmin UX)
    if (filterDepartment) {
      list = list.filter((u) => u.department === filterDepartment);
    }

    setAvailableUsers(list);
  }, [dashboardData, filterDepartment]);

  // ✅ Only clear selectedUserId after the user list is actually populated
  useEffect(() => {
    if (availableUsers.length === 0) return; // boot state → skip
    if (
      selectedUserId &&
      !availableUsers.some((u) => u._id === selectedUserId)
    ) {
      setSelectedUserId("");
    }
  }, [availableUsers, selectedUserId]);

  // Unified main watcher (includes selectedUserId so charts refresh when user changes)
  useEffect(() => {
    if (filterTimeframe === "custom" && (!filterStartDate || !filterEndDate))
      return;
    safeGetDashboardData();
    // eslint-disable-next-line
  }, [
    filterMonth,
    filterDepartment,
    selectedCompany,
    filterTimeframe,
    filterStartDate,
    filterEndDate,
    selectedUserId,
  ]);

  const resetFilters = () => {
    setFilterMonth("");
    setFilterDepartment("");
    setSelectedCompany("");
    setFilterTimeframe("");
    setFilterStartDate(null);
    setFilterEndDate(null);
    setSelectedUserId("");
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      {loading && <SpinLoader />}
      <div className="card my-5">
        <div>
          <div className="flex lg:items-center justify-between flex-col lg:flex-row gap-5 lg:gap-0">
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
            <div className="flex flex-wrap items-center gap-4">
              {/* Month filter */}
              <div className="flex gap-1 mb-4 items-start flex-col justify-start">
                <label className="text-sm font-medium text-gray-600">
                  Month:
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="border rounded px-3 py-2 text-sm text-white"
                >
                  <option value="" className="text-black">
                    All Months
                  </option>
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
              {/* Department filter */}
              {user?.role === "superAdmin" && (
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
                          (user?.role !== "superAdmin" &&
                            !departmentTotals[m.value]) ||
                          departmentTotals[m.value] === 0;
                        return (
                          <option
                            className={
                              isDisabled ? "text-gray-400" : "text-black"
                            }
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
              )}
              {/* User filter (superAdmin only) */}
              {user?.role === "superAdmin" && (
                <div className="flex gap-1 mb-4 items-start flex-col justify-start">
                  <label className="text-sm font-medium text-gray-600">
                    User:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="border rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="">All</option>
                    {availableUsers
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((u) => (
                        <option
                          key={u._id}
                          value={u._id}
                          className="text-black"
                        >
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Company filter */}
              <div className="flex gap-1 mb-4 items-start flex-col justify-start">
                <label className="text-sm font-medium text-gray-600">
                  Company:
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="border rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">All</option>
                  {availableCompanies.map((c) => (
                    <option key={c._id} value={c.name} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Timeframe filter */}
              <div className="flex gap-1 mb-4 items-start flex-col justify-start">
                <label className="text-sm font-medium text-gray-600">
                  Timeframe:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={filterTimeframe}
                    onChange={(e) => setFilterTimeframe(e.target.value)}
                    className="border rounded px-3 py-2 text-sm text-white"
                  >
                    <option className="text-black" value="">
                      This Month
                    </option>
                    <option className="text-black" value="today">
                      Today
                    </option>
                    <option className="text-black" value="yesterday">
                      Yesterday
                    </option>
                    <option className="text-black" value="last7Days">
                      Last 7 Days
                    </option>
                    <option className="text-black" value="custom">
                      Custom
                    </option>
                  </select>
                  {filterTimeframe === "custom" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col  justify-center">
                        <label className="text-sm font-medium text-gray-100">
                          From:
                        </label>
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                          className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                        />
                      </div>
                      <div className="flex flex-col  justify-center">
                        <label className="text-sm font-medium text-gray-100">
                          To:
                        </label>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          min={filterStartDate}
                          max={new Date().toISOString().split("T")[0]}
                          className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <RiResetLeftLine
                onClick={() => resetFilters()}
                className="text-white text-2xl cursor-pointer"
              />
            </div>
          </div>
        </div>
        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mt-5">
          {infoCard.map(({ label, key, color, description }) => (
            <InfoCard
              key={key}
              label={label}
              value={addThousandsSeperator(infoCardData?.[key] || 0)}
              color={color}
              description={description}
            />
          ))}
        </div>
      </div>

      <DailySOP sops={sops} email={userEmail} />

      {/* Charts */}
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

      {/* Recent tasks */}
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
