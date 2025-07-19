import { leadStats, officeQuotes } from "../../utils/data";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeperator, getGreeting } from "../../utils/helper";
import moment from "moment";
import InfoCard from "components/Cards/InfoCard";
import CustomBarChart from "components/Charts/CustomBarChart";
import { LuArrowRight } from "react-icons/lu";

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
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const prepareChartData = (data) => {
    const leadDistribution = data?.leadDistribution || {};

    const leadDistributionData = [
      { status: "followUp", count: leadDistribution?.followUp || 0 },
      { status: "onboarded", count: leadDistribution?.onboarded || 0 },
      { status: "argument", count: leadDistribution?.argument || 0 },
      { status: "negotiation", count: leadDistribution?.negotiation || 0 },
      { status: "pitch", count: leadDistribution?.pitch || 0 },
      { status: "dead", count: leadDistribution?.dead || 0 },
    ];

    setBarChartData(leadDistributionData);
  };

  const getDashboardData = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.LEADS.GET_DASHBOARD_DATA);

      if (res.data) {
        setDashboardData(res.data);
        prepareChartData(res.data?.charts);
        setRecentLeads(res.data?.recentLeads || []);
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
    navigate("/manage-lead");
  };

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

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-7 gap-3 md:gap-4 mt-5">
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
              <h5 className="font-medium"></h5>
            </div>

            {/* <CustomPieChart data={pieChartData} /> */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="text-lg">Recent Lead</h5>
              <button className="card-btn" onClick={onSeeMore}>
                View All
                <LuArrowRight className="text-base" />
              </button>
            </div>

            <table className="min-w-full">
              <thead>
                <tr className="text-left">
                  <th className="py-3 px-4 text-white font-semibold text-[13px]">
                    Company
                  </th>
                  <th className="py-3 px-4 text-white font-semibold text-[13px]">
                    Status
                  </th>
                  <th className="py-3 px-4 text-white font-semibold text-[13px]">
                    Type
                  </th>
                  <th className="py-3 px-4 text-white font-semibold text-[13px] table-cell">
                    Credential Deck
                  </th>
                  <th className="py-3 px-4 text-white font-semibold text-[13px] table-cell"></th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead._id} className="border-t border-gray-200">
                    <td className="my-2 mx-4 text-[13px] line-clamp-1 overflow-hidden">
                      {lead.companyName}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-sm rounded inline-block`}
                      ></span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-sm rounded inline-block `}
                      ></span>
                    </td>
                    <td className="px-4 py-2 text-white text-[13px] text-nowrap hidden md:table-cell"></td>
                    <td className="px-4 py-2 text-white text-[13px] text-nowrap hidden md:table-cell"></td>
                    <td className="px-4 py-2 md:table-cell text-2xl"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeadDashboard;
