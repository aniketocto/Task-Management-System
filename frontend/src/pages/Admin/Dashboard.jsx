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

const Dashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  // Prepare chart Data
  const prepareChartData = (data) => {
    const taskDistribution = data?.taskDistribution || null;
    const taskPriority = data?.taskPrioritiesLevels || null;

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
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA
      );

      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || null);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    getDashboardData();

    return () => {};
  }, []);

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="card my-5">
        <div>
          <div className="col-span-3">
            <h2 className="text-xl md:text-2xl">
              {getGreeting()}! {user?.name}
            </h2>
            <p className="text-sm md:text-[13px] text-gray-400 mt-1.5">
              {moment().format("dddd Do MMM YYYY")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-5">
          <InfoCard
            label="New Tasks"
            value={addThousandsSeperator(
              dashboardData?.charts?.taskDistribution?.new || 0
            )}
            color="bg-primary"
          />
          <InfoCard
            label="InProgress Tasks"
            value={addThousandsSeperator(
              dashboardData?.charts?.taskDistribution?.inProgress || 0
            )}
            color="bg-yellow-500"
          />
          <InfoCard
            label="Completed Tasks"
            value={addThousandsSeperator(
              dashboardData?.charts?.taskDistribution?.completed || 0
            )}
            color="bg-green-500"
          />
          <InfoCard
            label="Pending Tasks"
            value={addThousandsSeperator(
              dashboardData?.charts?.taskDistribution?.pending || 0
            )}
            color="bg-cyan-500"
          />
          <InfoCard
            label="Delayed Tasks"
            value={addThousandsSeperator(
              dashboardData?.charts?.taskDistribution?.delayed || 0
            )}
            color="bg-red-500"
          />{" "}
          <InfoCard
            label="Total Tasks"
            value={addThousandsSeperator(
              dashboardData?.charts?.taskDistribution?.All || 0
            )}
            color="bg-purple-500"
          />
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
