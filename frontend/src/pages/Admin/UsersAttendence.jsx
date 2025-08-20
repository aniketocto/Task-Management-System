import DashboardLayout from "components/layouts/DashboardLayout";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { FiCalendar } from "react-icons/fi";
import React from "react";
import { io } from "socket.io-client";
import Modal from "components/layouts/Modal";
import toast from "react-hot-toast";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem("taskManagerToken") },
  transports: ["websocket"], // skip HTTP polling
  withCredentials: true,
});
const UsersAttendence = () => {
  const [selectMonth, setSelectMonth] = useState(moment().format("YYYY-MM"));
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null);
  const [createHoliday, setCreateHoliday] = useState("");
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState(false);

  const openSetHoliday = () => {
    setCreateHoliday("");
    setOpen(true);
  };
  const closeSetHoliday = () => setOpen(false);

  const saveHoliday = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.HOLIDAYS.SET_HOLIDAYS, {
        label: label,
        date: createHoliday,
      });

      toast.success(res.data.message);
      fetchAttendance(selectMonth);
      setOpen(false);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (name, date, cell = {}) => {
    const toTime = (iso) => (iso ? moment(iso).format("hh:mm") : "");

    const inTime = toTime(cell.in);
    const outTime = toTime(cell.out);
    setEdit({
      id: cell.id || null,
      userId: cell.userId || userIdByName[name],
      name,
      date,
      inTime,
      outTime,
      _initial: { inTime, outTime },
    });
  };

  const saveEdit = async () => {
    const mergeDateTime = (datestr, timestr) => {
      if (!datestr || !timestr) return "";
      return moment(`${datestr} ${timestr}`, "YYYY-MM-DD hh:mm").toISOString();
    };

    const changedIn = edit.inTime !== edit._initial.inTime;
    const changedOut = edit.outTime !== edit._initial.outTime;

    const payload = {
      id: edit.id || undefined,
      userId: edit.userId,
      date: edit.date,
    };

    if (changedIn) {
      payload.checkIn = edit.inTime
        ? mergeDateTime(edit.date, edit.inTime)
        : null;
    }

    if (changedOut) {
      payload.checkOut = edit.outTime
        ? mergeDateTime(edit.date, edit.outTime) // set/replace
        : null; // explicit clear
    }

    try {
      setLoading(true);
      await axiosInstance.put(API_PATHS.ATTENDANCE.UPDATE_ATTENDANCE, payload);
      fetchAttendance(selectMonth);
      setEdit(null);
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setLoading(false);
    }
  };

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
      setHolidays(data.holidays || []);
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
      fetchAttendance(selectMonth);
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
      const dateKey = moment(a.date).format("YYYY-MM-DD");
      if (!m[name]) m[name] = {};
      m[name][dateKey] = {
        id: a._id, // <-- needed for update
        userId: a.user?._id, // <-- fallback for upsert
        in: a.checkIn || "",
        out: a.checkOut || "",
        checkInStatus: a.checkInStatus || "",
        checkOutStatus: a.checkOutStatus || "",
        work: a.totalHours || "",
      };
    });
    return m;
  }, [attendances]);

  const userNames = useMemo(
    () => Object.keys(byUser).sort((a, b) => a.localeCompare(b)),
    [byUser]
  );

  const userIdByName = useMemo(() => {
    const map = {};
    summary?.forEach((s) => {
      map[s.name] = s.userId;
    });
    // fallback from attendance list if needed
    attendances.forEach((a) => {
      const n = a.user?.name;
      const id = a.user?._id;
      if (n && id && !map[n]) map[n] = id;
    });
    return map;
  }, [summary, attendances]);

  const fmt = (ts) => ts && moment(ts).format("hh:mm A");

  const nameByUserId = useMemo(() => {
    const map = {};
    attendances.forEach((a) => {
      const id = a.user?._id;
      const n = a.user?.name;
      if (id && n) map[id] = n;
    });
    return map;
  }, [attendances]);

  const summaryByName = useMemo(() => {
    const map = {};
    (summary || []).forEach((s) => {
      const name = nameByUserId[s.userId] || s.name || s.userId || "—";
      map[name] = {
        present: Number(s.present) || 0,
        absent: Number(s.absent) || 0,
        halfDay: Number(s.halfDayTotal ?? s.halfDay) || 0,
        late: Number(s.late) || 0,
        total: Number(s.totalWorkingDays ?? s.total) || 0,
      };
    });
    return map;
  }, [summary, nameByUserId]);

  const holidayDates = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      const key = moment(h.date).format("YYYY-MM-DD");
      map[key] = h.label;
    });
    return map;
  }, [holidays]);

  const getStatusBgColor = (checkInStatus, checkOutStatus) => {
    const status = checkInStatus || checkOutStatus;

    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 ";
      case "absent":
        return "bg-red-400 text-red-800";
      case "halfDay":
        return "bg-orange-100 text-orange-800";
      case "late":
        return "bg-yellow-100 text-yellow-800 ";
      case "early":
        return "bg-yellow-100 text-yellow-800 ";
      default:
        return;
    }
  };

  return (
    <DashboardLayout activeMenu="Users Attendance">
      <div className="my-5 text-white px-2 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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

          <button onClick={openSetHoliday} className="w-fit! add-btn">
            Set Holiday
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-visible w-full border border-gray-700 rounded-lg  custom-scrollbar">
          <div className="relative min-w-[4500px]">
            <table className="min-w-full text-left border-collapse">
              <thead>
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
                      colSpan={3}
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
                <tr className="border-b border-gray-700">
                  {allDates.map((d) => (
                    <th
                      key={`${d}-date`}
                      colSpan={3}
                      className="px-2 py-2 text-xs font-medium text-gray-400 text-center border-r border-gray-700"
                    >
                      {moment(d).format("D / MM / YYYY")}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-gray-800">
                  {allDates.map((d) => (
                    <React.Fragment key={`${d}-sub`}>
                      <th className="px-2 py-1 text-xs font-medium text-gray-400 text-center border-r border-gray-800">
                        In
                      </th>
                      <th className="px-2 py-1 text-xs font-medium text-gray-400 text-center border-r border-gray-700">
                        Out
                      </th>
                      <th className="px-2 py-1 text-xs font-medium text-gray-400 text-center border-r border-gray-700">
                        Time
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
                      colSpan={1 + allDates.length * 3}
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
                          <React.Fragment key={d}>
                            <td
                              onClick={() => openEdit(name, d, cell)}
                              key={`${name}-${d}-in`}
                              className={`px-2 py-3 text-center text-md border-r border-gray-800 cursor-pointer
  ${
    holidayDates[d]
      ? "bg-blue-200 text-blue-800"
      : getStatusBgColor(cell?.checkInStatus)
  }`}
                              title={holidayDates[d] || ""}
                            >
                              {holidayDates[d] ? holidayDates[d] : fmt(cell.in)}
                            </td>
                            <td
                              onClick={() => openEdit(name, d, cell)}
                              key={`${name}-${d}-out`}
                              className={`px-2 py-3 text-center text-md border-r border-gray-700 cursor-pointer
  ${
    holidayDates[d]
      ? "bg-blue-200 text-blue-800"
      : getStatusBgColor(cell?.checkOutStatus)
  }`}
                              title={holidayDates[d] || ""}
                            >
                              {holidayDates[d]
                                ? holidayDates[d]
                                : fmt(cell.out)}
                            </td>
                            <td
                              onClick={() => openEdit(name, d, cell)}
                              key={`${name}-${d}-out`}
                              className={`px-2 py-3 text-center text-md border-r border-gray-700 cursor-pointer
  ${
    holidayDates[d]
      ? "bg-blue-200 text-blue-800"
      : getStatusBgColor(cell?.checkInStatus)
  }`}
                              title={holidayDates[d] || ""}
                            >
                              {holidayDates[d]
                                ? holidayDates[d]
                                : cell.work}
                            </td>
                          </React.Fragment>
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

      <Modal
        isOpen={!!edit}
        onClose={() => setEdit(null)}
        title={`Edit Attendance - ${edit?.name || ""}`}
      >
        <label className="block text-white text-sm">
          Date
          <input
            type="date"
            disabled
            value={edit?.date || ""}
            onChange={(e) => setEdit((s) => ({ ...s, date: e.target.value }))}
            className="form-input-date"
          />
        </label>

        {/* In time */}
        <label className="block text-white text-sm">
          In Time
          <input
            type="time"
            value={edit?.inTime || ""}
            onChange={(e) => setEdit((s) => ({ ...s, inTime: e.target.value }))}
            className="form-input-date"
          />
        </label>
        <label className="block text-white text-sm">
          Out Time
          <input
            type="time"
            value={edit?.outTime || ""}
            onChange={(e) =>
              setEdit((s) => ({ ...s, outTime: e.target.value }))
            }
            className="form-input-date"
          />
        </label>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={() => setEdit(null)}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-red-500/80 hover:bg-red-200 text-white hover:text-gray-800 cursor-pointer"
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal isOpen={open} onClose={closeSetHoliday} title={"Set Holiday"}>
        <label className="block text-white text-sm">
          Label
          <input
            type="text"
            value={label || ""}
            onChange={(e) => setLabel(e.target.value)}
            className="form-input"
            placeholder="Label"
          />
        </label>
        <label className="block text-white text-sm">
          Date
          <input
            type="date"
            value={createHoliday || ""}
            onChange={(e) => setCreateHoliday(e.target.value)}
            className="form-input-date"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={closeSetHoliday}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={saveHoliday}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-red-500/80 hover:bg-red-200 text-white hover:text-gray-800 cursor-pointer"
            title="Next step will enable Save"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default UsersAttendence;
