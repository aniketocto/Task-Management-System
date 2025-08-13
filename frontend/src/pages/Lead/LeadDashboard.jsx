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
import MeetingTable from "components/layouts/MeetingTable";
import SpinLoader from "components/layouts/SpinLoader";
import Modal from "components/layouts/Modal";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { GrNext, GrPrevious } from "react-icons/gr";

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

const QUARTER_MONTHS = {
  JFM: [1, 2, 3],
  AMJ: [4, 5, 6],
  JAS: [7, 8, 9],
  OND: [10, 11, 12],
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getQuarterKey = (d = new Date()) => {
  const m = d.getMonth() + 1;
  if (m <= 3) return "JFM";
  if (m <= 6) return "AMJ";
  if (m <= 9) return "JAS";
  return "OND";
};

const getQuarterYear = (d = new Date()) => d.getFullYear();
const formatINR = (n = 0) => (Number(n) || 0).toLocaleString("en-IN");

const QUARTER_LABELS = { JFM: "Q1", AMJ: "Q2", JAS: "Q3", OND: "Q4" };
const ORDERED_Q = ["JFM", "AMJ", "JAS", "OND"];

const prevQuarter = (key, year) => {
  const idx = ORDERED_Q.indexOf(key);
  if (idx <= 0) return { key: "OND", year: year - 1 };
  return { key: ORDERED_Q[idx - 1], year };
};

const nextQuarter = (key, year) => {
  const idx = ORDERED_Q.indexOf(key);
  if (idx === ORDERED_Q.length - 1) return { key: "JFM", year: year + 1 };
  return { key: ORDERED_Q[idx + 1], year };
};

const LeadDashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [categoryTreeMapData, setCategoryTreeMapData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const dailyQuote = useMemo(() => getDailyQuote(), []);
  const [loading, setLoading] = useState(false);

  const [qKey, setQKey] = useState(getQuarterKey());
  const [qYear, setQYear] = useState(getQuarterYear());

  const [targets, setTargets] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [limitDraft, setLimitDraft] = useState({});

  const [meetCount, setMeetCount] = useState(0);

  const isValidNumber = (v) => Number.isFinite(Number(v)) && Number(v) >= 0;

  const ymKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;

  const buildDraftFromData = () => {
    const draft = {};
    monthList.forEach(({ year, month }) => {
      const key = ymKey(year, month);

      const t = (targets?.month || []).find(
        (mm) => mm.year === year && mm.month === month
      )?.target;

      const p = (progress?.months || []).find(
        (mm) => mm.year === year && mm.month === month
      )?.plannedTarget;
      draft[key] = Number.isFinite(t) ? t : Number(p) || 0;
    });

    return draft;
  };

  const openSetLimit = () => {
    setLimitDraft(buildDraftFromData());
    setIsLimitOpen(true);
  };
  const closeSetLimit = () => setIsLimitOpen(false);

  const updateDraft = (key, val) => {
    const num = Number(val);
    setLimitDraft((prev) => ({
      ...prev,
      [key]: Number.isFinite(num) ? num : 0,
    }));
  };

  const monthList = QUARTER_MONTHS[qKey].map((m) => ({
    year: qYear,
    month: m,
    label: MONTH_LABELS[m - 1],
  }));

  const getMonthProgress = (y, m) => {
    return (
      (progress?.months || []).find(
        (row) => row.year === y && row.month === m
      ) || {
        plannedTarget: 0,
        carryIn: 0,
        effectiveTarget: 0,
        actual: 0,
        variance: 0,
      }
    );
  };

  const totals = progress?.totals || {
    plannedTarget: 0,
    effectiveTarget: 0,
    actual: 0,
    variance: 0,
  };

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
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.LEADS.GET_DASHBOARD_DATA);

      if (res.data) {
        setDashboardData(res.data);
        prepareChartData(res.data?.charts);
        prepareCategoryTreeMapData(res.data?.charts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const upcomingMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.LEADS.GET_MEETINGS);
      if (res.data) {
        setMeetings(res.data.meetings);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const buildSavePayload = () => {
    const months = QUARTER_MONTHS[qKey].map((m) => ({
      year: qYear,
      month: m,
      target: Number(limitDraft[ymKey(qYear, m)]) || 0,
    }));
    return {
      year: qYear,
      quarter: qKey,
      carryForward: targets?.carryForward ?? true,
      months,
    };
  };

  const saveLimits = async () => {
    for (const m of QUARTER_MONTHS[qKey]) {
      const key = ymKey(qYear, m);
      if (!isValidNumber(limitDraft[key])) {
        toast.error(`Enter a valid number for ${MONTH_LABELS[m - 1]}`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = buildSavePayload();

      await axiosInstance.post(API_PATHS.TARGETS.SET_TARGETS, payload);

      const [tRes, pRes] = await Promise.all([
        axiosInstance.get(API_PATHS.TARGETS.GET_TARGETS, {
          params: { year: qYear, quarter: qKey },
        }),
        axiosInstance.get(API_PATHS.TARGETS.TARGET_PROGRESS, {
          params: { year: qYear, quarter: qKey },
        }),
      ]);

      setTargets(tRes.data);
      setProgress(pRes.data);

      toast.success("Targets saved");
      setIsLimitOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDashboardData();
    upcomingMeetings();
    return () => {};
  }, [getDashboardData, upcomingMeetings]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [tRes, pRes] = await Promise.all([
          axiosInstance.get(API_PATHS.TARGETS.GET_TARGETS, {
            params: { year: qYear, quarter: qKey },
          }),
          axiosInstance.get(API_PATHS.TARGETS.TARGET_PROGRESS, {
            params: { year: qYear, quarter: qKey },
          }),
        ]);

        if (!alive) return;
        setTargets(tRes.data);
        setProgress(pRes.data);
      } catch (err) {
        if (!alive) return;
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load targets/progress"
        );
      } finally {
        setLoading(false);
      }
    };
    const meetCount = async () => {
      const res = await axiosInstance.get(API_PATHS.LEADS.MEETING_COUNTS);
      setMeetCount(res.data || 0);
    };

    meetCount();
    load();

    socket.on("lead:sync", load);
    return () => {
      alive = false;
      socket.off("lead:sync", load);
    };
  }, [qKey, qYear]);

  const meterFor = (row) => {
    const eff = Math.max(0, Number(row?.effectiveTarget) || 0);
    const actual = Math.max(0, Number(row?.actual) || 0);
    const carry = Math.max(0, Number(row?.carryIn) || 0);

    if (eff <= 0) return { green: 0, red: 0, grey: 100, surplus: 0 };

    const green = Math.min(100, (actual / eff) * 100);
    const red = Math.max(0, Math.min(100 - green, (carry / eff) * 100));
    const grey = Math.max(0, 100 - green - red);
    const surplus = Math.max(0, actual - eff);

    return { green, red, grey, surplus };
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mt-5">
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
      {loading && <SpinLoader />}

      <div className="card my-5">
        <div className="flex items-end justify-between mb-4">
          <div className="text-white text-xl font-semibold flex justify-center items-center gap-2">
            {QUARTER_LABELS[qKey]} {qYear} Targets
            {user?.role === "superAdmin" && (
              <button
                onClick={openSetLimit}
                className="text-xs lg:text-sm text-gray-400 font-semibold border border-gray-400 hover:shadow-2xs px-3 py-1 rounded-md cursor-pointer"
              >
                Set Limit
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const { key, year } = prevQuarter(qKey, qYear);
                setQKey(key);
                setQYear(year);
              }}
              className="cursor-pointer"
              aria-label="Previous quarter"
              title="Previous quarter"
            >
              <GrPrevious />
            </button>

            <select
              value={qKey}
              onChange={(e) => setQKey(e.target.value)}
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-gray-100"
            >
              {ORDERED_Q.map((q) => (
                <option key={q} value={q} className="text-gray-700">
                  {QUARTER_LABELS[q]}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={qYear}
              onChange={(e) => setQYear(Number(e.target.value) || qYear)}
              className="w-24 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-gray-100"
            />

            <button
              onClick={() => {
                const { key, year } = nextQuarter(qKey, qYear);
                setQKey(key);
                setQYear(year);
              }}
              className="cursor-pointer"
              aria-label="Next quarter"
              title="Next quarter"
            >
              <GrNext />
            </button>
          </div>
        </div>
        {!loading && error && (
          <div className="text-xs text-red-400 mb-3">{error}</div>
        )}
        {/* Legend + Quarter KPIs */}
        <div className="flex items-center justify-between mb-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-sm" /> Achieved
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-sm" /> Carry-in
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-600 rounded-sm" /> Remaining
            </span>
          </div>
        </div>

        {/* Optional compact KPI tiles (mobile-friendly) */}
        {progress && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-md px-3 py-2 bg-white/5 border border-white/10">
              <div className="text-[11px] text-gray-400">Target</div>
              <div className="text-sm text-gray-200">
                ₹{formatINR(totals.plannedTarget)}
              </div>
            </div>

            <div className="rounded-md px-3 py-2 bg-white/5 border border-white/10">
              <div className="text-[11px] text-gray-400">Achieved</div>
              <div className="text-sm text-green-400">
                ₹{formatINR(totals.actual)}
              </div>
            </div>
            <div className="rounded-md px-3 py-2 bg-white/5 border border-white/10">
              <div className="text-[11px] text-gray-400">Profit / Loss</div>
              <div
                className={`text-sm ${
                  totals.variance >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {totals.variance >= 0 ? "+" : ""}₹{formatINR(totals.variance)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {monthList.map((m) => (
            <div key={m.month} className="rounded-lg bg-black/30 p-3">
              <div className="text-white text-lg font-medium">{m.label}</div>

              {(() => {
                const row = getMonthProgress(m.year, m.month);
                const meter = meterFor(row);

                return (
                  <>
                    {/* Stacked meter with quick tooltips */}
                    <div className="mt-2 h-4 w-full rounded bg-gray-700 overflow-hidden flex">
                      <div
                        className="h-full bg-red-500 cursor-pointer"
                        style={{ width: `${meter.red}%` }}
                        title={`Carry-forward ₹${formatINR(row.carryIn)}`}
                      />
                      <div
                        className="h-full bg-green-500 cursor-pointer"
                        style={{ width: `${meter.green}%` }}
                        title={`Achieved ₹${formatINR(row.actual)}`}
                      />
                      <div
                        className="h-full bg-gray-600 cursor-pointer"
                        style={{ width: `${meter.grey}%` }}
                        title={`Remaining ₹${formatINR(
                          Math.max(
                            0,
                            (row.effectiveTarget || 0) - (row.actual || 0)
                          )
                        )}`}
                      />
                    </div>

                    {/* Clean, compact stats (same info as before, nicer hierarchy) */}
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="text-[11px] text-gray-400">Traget</div>
                      <div className="text-[11px] text-gray-200 text-right">
                        ₹{formatINR(row.plannedTarget)}
                      </div>

                      {row.carryIn > 0 && (
                        <>
                          <div className="text-[11px] text-gray-400">
                            Carry-forward
                          </div>
                          <div className="text-[11px] text-gray-200 text-right">
                            <span className="text-[11px] text-red-400 text-right">
                              ₹{formatINR(row.carryIn)}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-400">
                            Effective Target
                          </div>
                          <div className="text-[11px] text-gray-200 text-right">
                            ₹{formatINR(row.effectiveTarget)}
                          </div>
                        </>
                      )}

                      <div className="text-[11px] text-gray-400">Achieved</div>
                      <span className="text-[11px] text-green-400 text-right">
                        ₹{formatINR(row.actual)}
                      </span>

                      <div className="text-[11px] text-gray-400">
                        Profit / Loss
                      </div>
                      <div
                        className={`text-[11px] text-right ${
                          row.variance >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {row.variance >= 0 ? "+" : ""}₹{formatINR(row.variance)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div className="card h-[350px] flex flex-col">
        <div className="flex items-center justify-between">
          <h5 className="font-medium">Upcoming meetings</h5>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {meetCount.weekly?.map((w) => (
                <div
                  key={w.week}
                  className="rounded-md px-3 py-2 bg-white/5 border border-white/10"
                >
                  <div className="text-[11px] text-gray-400">Week {w.week}</div>
                  <div className="text-sm text-gray-200 text-center">{w.count}</div>
                </div>
              ))}
            </div>
            <div className="rounded-md px-3 py-2 bg-white/5 border border-white/10">
              <div className="text-[11px] text-gray-400">Total </div>
              <div className="text-sm text-gray-200 text-center">
                {meetCount.totalMeetings}
              </div>
            </div>
          </div>
        </div>
        <MeetingTable data={meetings} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        <div>
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="font-medium mb-6">Category</h5>
            </div>
            <CustomTreeMap data={categoryTreeMapData} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Status</h5>
          </div>

          <CustomBarChart data={barChartData} dataKey="status" />
        </div>
      </div>

      <Modal
        isOpen={isLimitOpen}
        onClose={closeSetLimit}
        title={`${
          { JFM: "Q1", AMJ: "Q2", JAS: "Q3", OND: "Q4" }[qKey]
        } ${qYear} · Set Monthly Targets`}
      >
        <div className="p-2 space-y-3">
          {monthList.map(({ year, month, label }) => {
            const key = ymKey(year, month);
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3"
              >
                <div className="text-sm text-gray-300 w-32">{label}</div>
                <div className="flex-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full rounded-md bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none  focus:ring-0"
                    value={limitDraft[key] ?? 0}
                    onChange={(e) => updateDraft(key, e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            );
          })}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeSetLimit}
              className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={saveLimits}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded bg-red-500/80 hover:bg-red-200 text-white hover:text-gray-800 cursor-pointer"
              title="Next step will enable Save"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default LeadDashboard;
