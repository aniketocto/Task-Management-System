// src/pages/admin/MyTasks.jsx

import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useContext, useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStatusTabs from "../../components/layouts/TaskStatusTabs";
import ManageTasksTable from "../../components/layouts/ManageTasksTable";
import ReactPaginate from "react-paginate";
import { UserContext } from "../../context/userContext";
import { LuFileSpreadsheet, LuLayoutGrid } from "react-icons/lu";
import TaskCard from "../../components/Cards/TaskCard";

const MyTasks = () => {
  const { user } = useContext(UserContext);
  const userRole = user?.role;
  
  const navigate = useNavigate();

  // --- state ---
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);

  const [page, setPage] = useState(1);
  const tasksPerPage = 12;
  const [totalPages, setTotalPages] = useState(1);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

  const [sortOrder, setSortOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("createdAt");
  const [filterPriority, setFilterPriority] = useState("");

  const [viewType, setViewType] = useState("table");

  // --- fetch only the months dropdown ---
  const fetchAvailableMonths = useCallback(async () => {
    try {
      const resp = await axiosInstance.get(API_PATHS.TASKS.GET_ADMIN_TASKS, {
        params: { fields: "availableMonths" },
      });
      const months = resp.data.availableMonths || [];
      setAvailableMonths(months);

      // auto-select: current month if present, else latest
      if (months.length && !filterMonth) {
        const curr = new Date().toISOString().slice(0, 7);
        const hasCurr = months.some((m) => m.value === curr);
        setFilterMonth(hasCurr ? curr : months[0].value);
      }
    } catch (err) {
      console.error("Error loading months:", err);
    }
  }, [filterMonth]);

  // --- fetch tasks for the selected month/status/etc ---
  const getAllTasks = useCallback(
    async (currentPage = 1) => {
      try {
        const resp = await axiosInstance.get(API_PATHS.TASKS.GET_ADMIN_TASKS, {
          params: {
            status: filterStatus === "All" ? "" : filterStatus,
            month: filterMonth || undefined,
            page: currentPage,
            limit: tasksPerPage,
            priority: filterPriority || undefined,
            sortOrder,
            sortBy,
            fields: "tasks,statusSummary",
          },
        });

        const tasks = resp.data.tasks || [];
        setAllTasks(tasks);

        // status tabs
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
      }
    },
    [filterStatus, filterMonth, filterPriority, sortOrder, sortBy]
  );

  // load months on mount
  useEffect(() => {
    fetchAvailableMonths();
  }, [fetchAvailableMonths]);

  // reload tasks whenever filters or page change
  useEffect(() => {
    getAllTasks(page);
  }, [getAllTasks, page]);

  const handleRowClick = (taskData) => {
    navigate(`/user/task-detail/${taskData}`);
  };

  return (
    <DashboardLayout activeMenu="View Tasks">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg md:text-xl font-medium text-white">
              View Tasks
            </h2>
            {/* View toggle */}
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

          {tabs[0]?.count > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Month dropdown driven by availableMonths */}
              {availableMonths.length > 0 && (
                <>
                  <label className="text-sm font-medium text-gray-600">
                    Month:
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value);
                      setPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm text-gray-50"
                  >
                    <option value="">All Months</option>
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
                </>
              )}

              {/* Status tabs */}
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={(tab) => {
                  setFilterStatus(tab);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>

        {viewType === "table" ? (
          <div className="mt-4">
            {/* Always render the table (it will render only the <thead> if no rows) */}
            <ManageTasksTable
              userRole={userRole}
              allTasks={allTasks}
              sortOrder={sortOrder}
              sortBy={sortBy}
              onToggleSort={() => {
                if (sortBy === "dueDate") {
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                } else {
                  setSortBy("dueDate");
                  setSortOrder("asc");
                }
                setPage(1);
              }}
              filterPriority={filterPriority}
              onPriorityChange={(p) => {
                setFilterPriority(p);
                setPage(1);
              }}
            />

            {/* If there were no tasks, show a “no data” message below the header */}
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
          previousLabel={"← Prev"}
          nextLabel={"Next →"}
          breakLabel={"..."}
          pageCount={totalPages}
          forcePage={page - 1}
          marginPagesDisplayed={2}
          pageRangeDisplayed={3}
          onPageChange={(e) => setPage(e.selected + 1)}
          containerClassName={"flex gap-2 mt-4 justify-center"}
          pageClassName={"px-3 py-1 border rounded"}
          activeClassName={"bg-primary text-white"}
          previousClassName={
            "px-3 py-1 cursor-pointer border text-white rounded"
          }
          nextClassName={"px-3 py-1 border cursor-pointer text-white rounded"}
          disabledClassName={"opacity-50 cursor-not-allowed"}
        />
      </div>
    </DashboardLayout>
  );
};

export default MyTasks;
