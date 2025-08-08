import DashboardLayout from "components/layouts/DashboardLayout";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { FiCalendar } from "react-icons/fi";
import React from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: {
    token: localStorage.getItem("taskManagerToken"),
  },
});

const UsersAttendence = () => {
  const [selectMonth, setSelectMonth] = useState(moment().format("YYYY-MM"));
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetcher (stable reference)
  const fetchAttendance = useCallback(async (month) => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        API_PATHS.ATTENDANCE.GET_ALL_ATTENDANCE,
        { params: { month } }
      );
      setAttendances(data.attendances || []);
      setSummary(data.summary || []);
      console.log("ATTENDANCE API →", data);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call fetcher on mount + whenever month changes
  useEffect(() => {
    fetchAttendance(selectMonth);
  }, [fetchAttendance, selectMonth]);

  useEffect(() => {
    socket.on("attendance:sync", () => {
      fetchAttendance(selectMonth)
    });
    return () => {
      socket.off("attendance:sync");
    };
  }, [fetchAttendance, selectMonth]);

  // All dates of the selected month (YYYY-MM-DD)
  const allDates = useMemo(() => {
    const start = moment(selectMonth, "YYYY-MM").startOf("month");
    const end = moment(selectMonth, "YYYY-MM").endOf("month");
    const days = [];
    let cur = start.clone();
    while (cur.isSameOrBefore(end, "day")) {
      days.push(cur.format("YYYY-MM-DD"));
      cur.add(1, "day");
    }
    return days;
  }, [selectMonth]);

  const byUser = useMemo(() => {
    const m = {};
    attendances.forEach((a) => {
      const name = a.user?.name || "—";
      const dateKey = moment(a.date).format("YYYY-MM-DD"); // normalize to match allDates

      if (!m[name]) m[name] = {};
      m[name][dateKey] = {
        in: a.checkIn || "",
        out: a.checkOut || "",
        status: a.checkInStatus || "", // keep if you want styling
      };
    });
    return m;
  }, [attendances]);

  const userNames = useMemo(
    () => Object.keys(byUser).sort((a, b) => a.localeCompare(b)),
    [byUser]
  );

  const fmt = (ts) => (ts ? moment(ts).format("hh:mm A") : "—");

  const summaryByName = useMemo(() => {
    const map = {};
    summary.forEach((s) => {
      map[s.name] = {
        present: s.present || 0,
        absent: s.absent || 0,
        halfDay: s.halfDay || 0,
        late: s.late || 0,
        total: s.totalWorkingDays || 0,
      };
    });
    return map;
  }, [summary]);

  return (
    <DashboardLayout activeMenu="Users Attendance">
      <div className="my-5 text-white px-2 sm:px-6">
        {/* Month Selector */}
        <div className="mb-6 flex items-center gap-2">
          <label className="text-sm font-medium">Select Month:</label>
          <div className="relative w-fit">
            <input
              type="month"
              value={selectMonth}
              onChange={(e) => setSelectMonth(e.target.value)}
              className="text-white bg-gray-800 border border-gray-600 px-3 py-2 rounded pl-10 focus:outline-none"
            />
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-sm pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-visible w-full border border-gray-700 rounded-lg  custom-scrollbar">
          <div className="relative min-w-[4000px]">
            <table className="min-w-full text-left border-collapse">
              <thead>
                {/* Row 1: Day headers */}
                <tr className="border-b border-gray-700">
                  <th
                    rowSpan={3}
                    className="px-4 py-2 text-sm font-semibold text-gray-300 sticky left-0 bg-gray-700 z-10 border-r border-gray-700"
                  >
                    Name
                  </th>
                  {allDates.map((d) => (
                    <th
                      key={`${d}-day`}
                      colSpan={2}
                      className="px-2 py-2 text-sm font-semibold text-gray-300 text-center border-r border-gray-700"
                    >
                      {moment(d).format("ddd")}
                    </th>
                  ))}
                  <th
                    rowSpan={3}
                    className="px-2 py-2 text-sm font-semibold text-gray-300 text-center border-l border-gray-700"
                  >
                    Present
                  </th>
                  <th
                    rowSpan={3}
                    className="px-2 py-2 text-sm font-semibold text-gray-300 text-center border-l border-gray-700"
                  >
                    Absent
                  </th>
                  <th
                    rowSpan={3}
                    className="px-2 py-2 text-sm font-semibold text-gray-300 text-center border-l border-gray-700"
                  >
                    Half Day
                  </th>
                  <th
                    rowSpan={3}
                    className="px-2 py-2 text-sm font-semibold text-gray-300 text-center border-l border-gray-700"
                  >
                    Late
                  </th>
                  <th
                    rowSpan={3}
                    className="px-2 py-2 text-sm font-semibold text-gray-300 text-center border-l border-gray-700"
                  >
                    Total
                  </th>
                </tr>

                {/* Row 2: Date headers */}
                <tr className="border-b border-gray-700">
                  {allDates.map((d) => (
                    <th
                      key={`${d}-date`}
                      colSpan={2}
                      className="px-2 py-2 text-xs font-medium text-gray-400 text-center border-r border-gray-700"
                    >
                      {moment(d).format("D / MM / YYYY")}
                    </th>
                  ))}
                </tr>

                {/* Row 3: In/Out sub-headers */}
                <tr className="border-b border-gray-800">
                  {allDates.map((d) => (
                    <React.Fragment key={`${d}-sub`}>
                      <th className="px-2 py-1 text-xs font-medium text-gray-400 text-center border-r border-gray-800">
                        In
                      </th>
                      <th className="px-2 py-1 text-xs font-medium text-gray-400 text-center border-r border-gray-700">
                        Out
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-400"
                      colSpan={1 + allDates.length * 2}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading attendance data...
                      </div>
                    </td>
                  </tr>
                ) : userNames.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-400"
                      colSpan={1 + allDates.length * 2}
                    >
                      No attendance data found for{" "}
                      {moment(selectMonth).format("MMMM YYYY")}
                    </td>
                  </tr>
                ) : (
                  userNames.map((name) => (
                    <tr
                      key={name}
                      className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors `}
                    >
                      <td className="px-4 py-3 text-white text-sm bg-gray-700 font-medium whitespace-nowrap sticky left-0  z-10 border-r border-gray-700">
                        {name}
                      </td>
                      {allDates.map((d) => {
                        const cell = byUser[name]?.[d] || {};
                        return (
                          <>
                            <td
                              key={`${name}-${d}-in`}
                              className={`px-2 py-3 text-center text-md border-r border-gray-800 `}
                            >
                              {fmt(cell.in)}
                            </td>
                            <td
                              key={`${name}-${d}-out`}
                              className={`px-2 py-3 text-center text-md border-r border-gray-700 }`}
                            >
                              {fmt(cell.out)}
                            </td>
                          </>
                        );
                      })}
                      <td className="px-2 py-3 text-center text-md border-l border-gray-700">
                        {summaryByName[name]?.present ?? 0}
                      </td>
                      <td className="px-2 py-3 text-center text-md border-l border-gray-700">
                        {summaryByName[name]?.absent ?? 0}
                      </td>
                      <td className="px-2 py-3 text-center text-md border-l border-gray-700">
                        {summaryByName[name]?.halfDay ?? 0}
                      </td>
                      <td className="px-2 py-3 text-center text-md border-l border-gray-700">
                        {summaryByName[name]?.late ?? 0}
                      </td>
                      <td className="px-2 py-3 text-center text-md border-l border-gray-700">
                        {summaryByName[name]?.total ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsersAttendence;
