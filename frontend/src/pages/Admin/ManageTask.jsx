import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const ManageTask = () => {
  const [allTask, setAllTask] = useState([]);
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

      setAllTask(response.data?.tasks?.length > 0 ? response.data?.tasks : []);

      // Map StatusSummary data with fixed label
      const statusSummary = response.data?.statusSummary || {};
      const statusArray = [
        { label: "All", count: statusSummary?.all || 0 },
        { label: "New", count: statusSummary?.new || 0 },
        { label: "In Progress", count: statusSummary?.inProgress || 0 },
        { label: "Completed", count: statusSummary?.completed || 0 },
        { label: "Pending", count: statusSummary?.pending || 0 },
        { label: "Delayed", count: statusSummary?.delayed || 0 },
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
      <div className="my-5"></div>
    </DashboardLayout>
  );
};

export default ManageTask;
