import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import moment from "moment";
import { beautify } from "../../utils/helper";
import { FiCalendar } from "react-icons/fi";
import Calendar from "../../components/layouts/Calender";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: {
    token: localStorage.getItem("taskManagerToken"),
  },
});

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("YYYY-MM")
  );

  const fetchAttendance = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(
        `/api/attendance/me?month=${selectedMonth}`
      );
      setAttendances(data.attendances || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error("Error loading attendance:", err);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    socket.on("attendance:sync", () => {
      fetchAttendance();
    });
    return () => {
      socket.off("attendance:sync");
    };
  }, [fetchAttendance]);

  const daysInMonth = moment(selectedMonth).daysInMonth();
  const monthStart = moment(selectedMonth).startOf("month");

  // Create attendance map
  const attendanceMap = {};
  attendances.forEach((a) => {
    attendanceMap[moment(a.date).format("YYYY-MM-DD")] = a;
  });

  return (
    <DashboardLayout activeMenu="Attendance">
      <div className="my-5 text-white px-2 sm:px-6">
        {/* Month Selector */}
        <div className="mb-6 flex items-center gap-2 ">
          <label className="text-sm font-medium">Select Month:</label>
          <div className="relative w-fit">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-white bg-gray-800 border border-gray-600 px-3 py-2 rounded pl-10 focus:outline-none"
            />
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-sm pointer-events-none" />
          </div>
        </div>
        {/* Summary Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 card">
          <SummaryBox label="Present" value={summary.present} />
          <SummaryBox label="Late" value={summary.late} />
          <SummaryBox label="Half Day" value={summary.halfDay} />
          <SummaryBox label="Absent" value={summary.absent} />
          <SummaryBox label="Working Days" value={summary.totalWorkingDays} />
        </div>

        {/* Calendar Component - Replace the grid with your Calendar component */}
      </div>
      <div className="card">
        <Calendar
          monthStart={monthStart}
          daysInMonth={daysInMonth}
          attendanceMap={attendanceMap}
          getStatusColor={getStatusColor}
          beautify={beautify}
        />
      </div>
    </DashboardLayout>
  );
};

const SummaryBox = ({ label, value }) => (
  <div className="bg-gray-800 p-3 rounded-lg text-center shadow">
    <div className="text-sm text-gray-400">{label}</div>
    <div className="text-lg font-semibold text-white">{value ?? 0}</div>
  </div>
);

// Color-coding based on status
const getStatusColor = (status) => {
  switch (status) {
    case "present":
      return "border-green-500";
    case "late":
      return "border-yellow-500";
    case "halfDay":
      return "border-orange-500";
    case "absent":
      return "border-red-500";
    default:
      return "border-white";
  }
};

export default Attendance;
