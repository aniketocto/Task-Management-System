import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuFileSpreadsheet } from "react-icons/lu";
import TaskStatusTabs from "../../components/layouts/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";

const ManageTask = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const navigate = useNavigate();

  const getAllTasks = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
        },
      });

      let tasks = response.data?.tasks || [];

      // sort by createdAt descending (newest first)
      tasks = tasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAllTasks(tasks);

      const statusSummary = response.data?.statusSummary || {};
      const statusArray = [
        { label: "All", count: statusSummary?.all || 0 },
        { label: "new", count: statusSummary?.newTasks || 0 },
        { label: "inProgress", count: statusSummary?.inProgressTasks || 0 },
        { label: "completed", count: statusSummary?.completedTasks || 0 },
        { label: "pending", count: statusSummary?.pendingTasks || 0 },
        { label: "delayed", count: statusSummary?.delayedTasks || 0 },
      ];

      setTabs(statusArray);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleClick = (taskData) => {
    navigate("/admin/create-task", { state: { taskId: taskData } });
  };

  const handleDownloadTaskReport = () => {};

  useEffect(() => {
    getAllTasks(filterStatus);
    return () => {};
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-medium">My Tasks</h2>
            <button
              onClick={handleDownloadTaskReport}
              className="flex lg:hidden download-btn"
            >
              <LuFileSpreadsheet className="text-gray-400 text-lg" />
              Download Report
            </button>
          </div>

          {tabs?.[0]?.count > 0 && (
            <div className="flex items-center gap-3">
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />

              <button className="hidden md:flex download-btn">
                <LuFileSpreadsheet className="text-gray-400 text-lg" />
                Download Report
              </button>
            </div>
          )}
        </div>

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
              assignedTo={item.assignedTo?.map((item) => item.profileImageUrl)}
              attachmentsCount={item.attachments?.length || 0}
              completedTodoCount={item.completedTodoCount || 0}
              todoChecklist={item.todoChecklist || []}
              onClick={() => handleClick(item._id)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageTask;
