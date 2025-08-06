// src/pages/admin/ManageTask.jsx

import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useEffect, useState, useCallback, useContext } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import ManageTasksTable from "../../components/layouts/ManageTasksTable";
import ReactPaginate from "react-paginate";
import { UserContext } from "../../context/userContext";
import { LuFileSpreadsheet, LuLayoutGrid } from "react-icons/lu";
import TaskCard from "../../components/Cards/TaskCard";
import SpinLoader from "../../components/layouts/SpinLoader";
import { FiX } from "react-icons/fi";

import { io } from "socket.io-client";
import { addThousandsSeperator } from "../../utils/helper";
import { infoCard } from "../../utils/data";
import InfoCard from "../../components/Cards/InfoCard";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: {
    token: localStorage.getItem("taskManagerToken"),
  },
});

const ManageTask = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const userRole = user?.role;

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchSerial, setSearchSerial] = useState("");
  const [debouncedSearchSerial, setDebouncedSearchSerial] = useState("");

  const [page, setPage] = useState(() => {
    return parseInt(localStorage.getItem("lastPage")) || 1;
  });
  const tasksPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [statusSummary, setStatusSummary] = useState({});

  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [availableMonths, setAvailableMonths] = useState([]);
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem("taskSortBy") || "createdAt";
  });

  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem("taskSortOrder") || "desc";
  });

  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  const [viewType, setViewType] = useState("table");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filterTimeframe) setFilterMonth("");
    if (filterTimeframe !== "custom") {
      setFilterStartDate("");
      setFilterEndDate("");
    }
  }, [filterTimeframe]);

  useEffect(() => {
    if (filterMonth) {
      setFilterTimeframe("");
      setFilterStartDate("");
      setFilterEndDate("");
    }
  }, [filterMonth]);

  useEffect(() => {
    if (filterDepartment) setPage(1);
  }, [filterDepartment]);

  const fetchAvailableMonths = useCallback(async () => {
    try {
      const resp = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          department: filterDepartment || undefined,
          fields: "availableMonths",
        },
      });
      setAvailableMonths(resp.data.availableMonths || []);
    } catch (err) {
      console.error("Failed to load months:", err);
    }
  }, [filterDepartment]);

  const fetchCompanies = useCallback(async () => {
    try {
      const resp = await axiosInstance.get(API_PATHS.COMPANY.GET_COMPANY);
      setAvailableCompanies(resp.data || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  }, []);

  const getAllTasks = useCallback(
    async (currentPage = 1) => {
      try {
        setLoading(true);
        const resp = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
          params: {
            status: filterStatus === "All" ? "" : filterStatus,
            month: filterMonth || undefined,
            department: filterDepartment || undefined,
            priority: filterPriority || undefined,
            timeframe: filterTimeframe || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
            page: currentPage,
            limit: tasksPerPage,
            sortOrder,
            sortBy,
            fields: "tasks,statusSummary,availableMonths",
            serialNumber: debouncedSearchSerial || undefined,
            companyName: selectedCompany || undefined,
          },
        });

        const tasks = resp.data.tasks || [];
        setAllTasks(tasks);
        setStatusSummary(resp.data.statusSummary || {});

        const staticDepartments = [
          "Creative",
          "Digital",
          "Social",
          "DevelopmentUiUx",
          "Strategy",
          "BusinessDevelopment",
          "ClientServicing",
          "HR",
        ];
        setDepartments(staticDepartments);

        const s = resp.data.statusSummary || {};
        setTabs([
          { label: "All", count: s.all || 0 },
          { label: "new", count: s.newTasks || 0 },
          { label: "inProgress", count: s.inProgressTasks || 0 },
          { label: "completed", count: s.completedTasks || 0 },
          { label: "pending", count: s.pendingTasks || 0 },
          { label: "delayed", count: s.delayedTasks || 0 },
        ]);

        setTotalPages(Math.ceil((s.all || 0) / tasksPerPage));
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      filterStatus,
      filterMonth,
      filterDepartment,
      filterPriority,
      filterTimeframe,
      filterStartDate,
      filterEndDate,
      sortOrder,
      sortBy,
      debouncedSearchSerial,
      selectedCompany,
    ]
  );

  // debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchSerial(searchSerial); // Apply after 400ms
      // setPage(1); // Reset to page 1 on search
    }, 1000); // adjust delay as needed

    return () => clearTimeout(timeout); // Cleanup on next keystroke
  }, [searchSerial]);

  useEffect(() => {
    fetchAvailableMonths();
    fetchCompanies();
  }, [fetchAvailableMonths, fetchCompanies]);

  useEffect(() => {
    getAllTasks(page);
    localStorage.setItem("lastPage", page);
  }, [getAllTasks, page]);

  // useEffect(() => {
  //   if (availableMonths.length > 0 && !filterMonth && !filterTimeframe) {
  //     // Sort months in descending order (latest first)
  //     const sorted = [...availableMonths].sort((a, b) =>
  //       b.value.localeCompare(a.value)
  //     );
  //     // Try to find the most recent month with count > 0
  //     const recentWithData = sorted.find((m) => (m.count || 0) > 0);
  //     // Set that as filterMonth, otherwise default to the first (most recent) month
  //     setFilterMonth(recentWithData ? recentWithData.value : sorted[0].value);
  //     setPage(1);
  //   }
  // }, [availableMonths, filterMonth, filterTimeframe]);

  // console.log("availableMonths", availableMonths);

  useEffect(() => {
    socket.on("task:sync", () => {
      getAllTasks(page); // silently refresh tasks
      // console.log("task:sync");
    });

    return () => {
      socket.off("task:sync"); // clean up
    };
  }, [getAllTasks, page]);

  // useEffect(() => {
  //   if (allTasks.length === 0 && selectedCompany) {
  //     // clear the filter back to “All companies”
  //     setSelectedCompany("");
  //   }
  // }, [allTasks, selectedCompany]);

  const handleRowClick = (taskId) => {
    navigate("/admin/create-task", { state: { taskId } });
  };

  // console.log(statusSummary["all"]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="my-5">
        <div className="flex flex-col gap-5 card justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg text-white md:text-xl font-medium">
                My Tasks
              </h2>
              <div className="flex items-center border rounded overflow-hidden">
                <button
                  onClick={() => setViewType("table")}
                  className={`p-2 ${
                    viewType === "table"
                      ? "bg-primary text-white"
                      : "text-gray-400"
                  }`}
                >
                  <LuFileSpreadsheet size={20} />
                </button>
                <button
                  onClick={() => setViewType("grid")}
                  className={`p-2 ${
                    viewType === "grid"
                      ? "bg-primary text-white"
                      : "text-gray-400"
                  }`}
                >
                  <LuLayoutGrid size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Timeframe */}
              <div className="flex gap-1 flex-col">
                <label className="text-sm font-medium text-gray-600">
                  Timeframe:
                </label>
                <select
                  value={filterTimeframe}
                  onChange={(e) => {
                    setFilterTimeframe(e.target.value);
                    setPage(1);
                  }}
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
                  <>
                    <label className="text-sm font-medium text-gray-100">
                      From:
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => {
                        setFilterStartDate(e.target.value);
                        setPage(1);
                      }}
                      max={new Date().toISOString().split("T")[0]}
                      className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                    />
                    <label className="text-sm font-medium text-gray-100">
                      To:
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setPage(1);
                      }}
                      min={filterStartDate}
                      max={new Date().toISOString().split("T")[0]}
                      className="border rounded px-3 py-2 text-sm text-white bg-gray-800"
                    />
                  </>
                )}
              </div>
              {/* Company */}
              <div className="flex gap-1 flex-col">
                <label className="text-sm font-medium text-gray-600">
                  Company:
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-3 py-2 text-sm text-white"
                >
                  <option value="" className="text-black">
                    All
                  </option>
                  {availableCompanies.map((c) => (
                    <option key={c._id} value={c.name} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              {user.role === "superAdmin" && (
                <div className="flex gap-1 flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Department:
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => {
                      setFilterDepartment(e.target.value);
                      setPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="" className="text-black">
                      All
                    </option>
                    {departments.map((d) => (
                      <option key={d} value={d} className="text-black">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month */}
              {availableMonths.length > 0 && (
                <div className="flex gap-1 flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Month:
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value);
                      setPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="" className="text-black">
                      All Months
                    </option>
                    {availableMonths
                      .sort((a, b) => b.value.localeCompare(a.value))
                      .slice(0, 12)
                      .map((m) => (
                        <option
                          key={m.value}
                          value={m.value}
                          className="text-black"
                        >
                          {m.label}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {/* User
              {users.length > 0 && (
                <>
                  <label className="text-sm font-medium text-gray-100">User:</label>
                  <select value={filterUser} onChange={(e) => { setFilterUser(e.target.value); setPage(1); }} className="border rounded px-3 py-2 text-sm text-white">
                    <option value="">All Users</option>
                    {users.map((u) => (<option key={u._id} value={u._id} className="text-black">{u.name}</option>))}
                  </select>
                </>
              )} */}

              {/* Status Tabs */}
              {/* <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={(newStatus) => {
                  setFilterStatus(newStatus);
                  setPage(1);
                }}
              /> */}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mt-5">
            {infoCard.map(({ label, key1, color, description }) => (
              <InfoCard
                key={key1}
                label={label}
                value={addThousandsSeperator(statusSummary[key1] || 0)}
                color={color}
                description={description}
              />
            ))}
          </div>
        </div>
        {loading && <SpinLoader />}
        <div className="mt-4 flex gap-2 items-center">
          <label className="text-white text-sm">Search Serial:</label>
          <div className="flex items-center">
            <span className="text-white text-sm bg-gray-800 pl-1 py-1 border-y border-l border-gray-600 rounded-l">
              U
            </span>
            <input
              type="text"
              value={searchSerial.replace(/^U/i, "")} // remove leading U for input field
              onChange={(e) =>
                setSearchSerial("U" + e.target.value.toUpperCase())
              }
              placeholder="001"
              className="pl-0.5 py-1 rounded-r bg-gray-800 text-white border-t border-b border-r border-gray-600 text-sm focus:outline-none focus:ring-0"
            />
            <FiX />
          </div>
        </div>

        {viewType === "table" ? (
          <div className="mt-4">
            <ManageTasksTable
              userRole={userRole}
              allTasks={allTasks}
              sortOrder={sortOrder}
              sortBy={sortBy}
              onToggleSort={() => {
                if (sortBy === "dueDate") {
                  const newOrder = sortOrder === "asc" ? "desc" : "asc";
                  setSortOrder(newOrder);
                  localStorage.setItem("taskSortOrder", newOrder);
                } else {
                  setSortBy("dueDate");
                  setSortOrder("asc");
                  localStorage.setItem("taskSortBy", "dueDate");
                  localStorage.setItem("taskSortOrder", "asc");
                }
                setPage(1);
              }}
              filterPriority={filterPriority}
              onPriorityChange={(p) => {
                setFilterPriority(p);
              }}
              filterStatus={filterStatus}
              onStatusChange={(s) => {
                setFilterStatus(s);
              }}
            />
            {allTasks.length === 0 && (
              <p className="mt-2 text-center text-white">
                No tasks found for this filter.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {allTasks.map((item) => (
              <TaskCard
                key={item._id}
                title={item.title}
                company={item.companyName}
                desc={item.description}
                priority={item.priority}
                status={item.status}
                progress={item.progress}
                createdAt={item.createdAt}
                dueDate={item.dueDate}
                assignedTo={item.assignedTo?.map((u) => u.profileImageUrl)}
                attachmentsCount={item.attachments?.length || 0}
                completedTodoCount={item.completedTodoCount || 0}
                todoChecklist={item.todoChecklist || []}
                onClick={() => handleRowClick(item._id)}
              />
            ))}
          </div>
        )}

        <ReactPaginate
          previousLabel={"Previous"}
          nextLabel={"Next"}
          breakLabel={"..."}
          pageCount={totalPages}
          forcePage={page - 1}
          marginPagesDisplayed={2}
          pageRangeDisplayed={3}
          onPageChange={(e) => setPage(e.selected + 1)}
          containerClassName="flex gap-2 mt-4 justify-center"
          pageClassName="" // leave this empty
          pageLinkClassName="px-3 py-1 border rounded text-white cursor-pointer transition-colors duration-200 block"
          activeLinkClassName="bg-[#E43941] border-[#E43941] text-white"
          previousLinkClassName="px-3 py-1 border text-white rounded cursor-pointer block"
          nextLinkClassName="px-3 py-1 border text-white rounded cursor-pointer block"
          disabledLinkClassName="opacity-50 cursor-not-allowed"
        />
      </div>
    </DashboardLayout>
  );
};

export default ManageTask;
