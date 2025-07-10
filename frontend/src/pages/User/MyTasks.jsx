import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuFileSpreadsheet } from "react-icons/lu";
import TaskStatusTabs from "../../components/layouts/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import ReactPaginate from "react-paginate";

const MyTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const tasksPerPage = 12;
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [allMonthCount, setAllMonthCount] = useState(0);

  const navigate = useNavigate();

  const getAllTasks = async (currentPage = 1) => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
          month: filterMonth || undefined,
          page: currentPage,
          limit: tasksPerPage,
        },
      });

      let tasks = response.data?.tasks || [];

      if (tasks.length === 0) {
        if (filterStatus !== "All") {
          setFilterStatus("All");
        }
        return;
      }

      // sort by createdAt descending (newest first)
      tasks = tasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAllTasks(tasks);

      let monthsData, allTimeTotal, statusSummary;

      monthsData = response.data.monthlyData.monthsData;
      allTimeTotal = response.data.monthlyData.allTimeTotal;
      statusSummary = response.data.statusSummary;

      const statusArray = [
        { label: "All", count: statusSummary?.all || 0 },
        { label: "new", count: statusSummary?.newTasks || 0 },
        { label: "inProgress", count: statusSummary?.inProgressTasks || 0 },
        { label: "completed", count: statusSummary?.completedTasks || 0 },
        { label: "pending", count: statusSummary?.pendingTasks || 0 },
        { label: "delayed", count: statusSummary?.delayedTasks || 0 },
      ];

      setTabs(statusArray);

      setAvailableMonths(monthsData?.filter((m) => m.count > 0) || []);

      setAllMonthCount(allTimeTotal || 0);

      const totalCount = response.data?.statusSummary?.all || 0;
      setTotalPages(Math.ceil(totalCount / tasksPerPage));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // 🔄 Call whenever filterStatus, filterMonth, or page changes
  useEffect(() => {
    getAllTasks();
    return () => {};
  }, [filterStatus, filterMonth, page]);

  useEffect(() => {
    if (!filterMonth && availableMonths.length > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. '2025-07'

      const match = availableMonths.find((m) => m.value === currentMonth);
      if (match) {
        setFilterMonth(currentMonth);
      }
    }
  }, [availableMonths]);

  const handleClick = (taskId) => {
    navigate(`/user/task-detail/${ taskId}`);
  };

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-medium text-white">My Tasks</h2>
          </div>

          {tabs?.[0]?.count > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {/* month filter */}
              {availableMonths.length > 0 && (
                <>
                  <label className="text-sm font-medium text-gray-600">
                    Month:
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="border rounded px-3 py-2 text-sm text-gray-50 max-h-48 overflow-y-auto"
                  >
                    {/* <option value="">All Months ({allMonthCount})</option> */}
                    {/* <option value="">All Months</option> */}

                    {/* render in reverse order so latest comes first */}
                    {[...availableMonths]
                      .sort((a, b) => b.value.localeCompare(a.value)) // descending
                      .slice(0, 12) // only the most recent 12
                      .map((m) => (
                        <option key={m.value} value={m.value} className="text-black">
                          {m.label}
                        </option>
                      ))}
                  </select>
                </>
              )}

             
            </div>
          )}
        </div>

        {allTasks.length === 0 ? (
          <p>No tasks found for this status in selected month.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {allTasks?.map((item) => (
                <TaskCard
                  key={item._id}
                  title={item.title}
                  desc={item.description}
                  priority={item.priority}
                  status={item.status}
                  progress={item.progress}
                  createdAt={item.createdAt}
                  dueDate={item.dueDate}
                  assignedTo={item.assignedTo?.map(
                    (item) => item.profileImageUrl
                  )}
                  attachmentsCount={item.attachments?.length || 0}
                  completedTodoCount={item.completedTodoCount || 0}
                  todoChecklist={item.todoChecklist || []}
                  onClick={() => handleClick(item._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            <ReactPaginate
              previousLabel={"← Prev"}
              nextLabel={"Next →"}
              breakLabel={"..."}
              pageCount={totalPages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              onPageChange={(e) => setPage(e.selected + 1)}
              containerClassName={"flex gap-2 mt-4 justify-center"}
              pageClassName={"px-3 py-1 border rounded"}
              activeClassName={"bg-[#e43941] text-white"}
              previousClassName={"px-3 py-1 text-white border rounded"}
              nextClassName={"px-3 py-1 border text-white rounded"}
              disabledClassName={"opacity-50 cursor-not-allowed"}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTasks;
