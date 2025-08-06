import { leadStats, officeQuotes } from "../../utils/data";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeperator, getGreeting } from "../../utils/helper";
import moment from "moment";
import InfoCard from "components/Cards/InfoCard";
import CustomBarChart from "components/Charts/CustomBarChart";

import CustomTreeMap from "components/Charts/CustomTreeMap";

const getDailyQuote = () => {
  const today = new Date().toISOString().slice(0, 10);
  const key = Object.keys(officeQuotes);

  const hash =
    today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    key.length;
  return officeQuotes[key[hash]];
};

const LeadDashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [categoryTreeMapData, setCategoryTreeMapData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const prepareChartData = (data) => {
    const leadDistribution = data?.leadDistribution || {};

    const leadDistributionData = [
      { status: "new", count: leadDistribution?.new || 0 },
      { status: "followUp", count: leadDistribution?.followUp || 0 },
      { status: "onboarded", count: leadDistribution?.onboarded || 0 },
      { status: "agreement", count: leadDistribution?.agreement || 0 },
      { status: "negotiation", count: leadDistribution?.negotiation || 0 },
      { status: "pitch", count: leadDistribution?.pitch || 0 },
      { status: "dead", count: leadDistribution?.dead || 0 },
    ];

    setBarChartData(leadDistributionData);
  };

  const prepareCategoryTreeMapData = (data) => {
    const dist = data?.categoryDistribution || {};
    const arr = Object.entries(dist)
      // eslint-disable-next-line
      .filter(([i, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
    setCategoryTreeMapData(arr);
  };

  const getDashboardData = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.LEADS.GET_DASHBOARD_DATA);

      if (res.data) {
        setDashboardData(res.data);
        prepareChartData(res.data?.charts);
        prepareCategoryTreeMapData(res.data?.charts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, []);

  useEffect(() => {
    getDashboardData();
    return () => {};
  }, [getDashboardData]);

  console.log(categoryTreeMapData);

  return (
    <DashboardLayout activeMenu="Lead Dashboard">
      <div className="card my-5">
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

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-8 gap-3 md:gap-4 mt-5">
          {leadStats.map(({ label, key, color }) => (
            <InfoCard
              key={key}
              label={label}
              value={addThousandsSeperator(
                dashboardData?.statistic?.[key] || 0
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
              <h5 className="font-medium mb-6">Leads by Category</h5>
            </div>
            <CustomTreeMap data={categoryTreeMapData} />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Lead Stat Level</h5>
            </div>

            <CustomBarChart data={barChartData} dataKey="status" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeadDashboard;
