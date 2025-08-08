const { Parser } = require("json2csv");
const {
  getDistanceMeters,
  OFFICE_LAT,
  OFFICE_LNG,
  OFFICE_RADIUS_METERS,
} = require("../config/geofence");
const Attendance = require("../models/attendanceModel");

const applyBusinessRule = (attendence) => {
  const { checkIn, checkOut } = attendence;

  const cutoffLate = new Date(attendence.date);
  cutoffLate.setHours(10, 15, 0, 0);

  const cutoffHalfDay = new Date(attendence.date);
  cutoffHalfDay.setHours(11, 0, 0, 0);

  const cutoffEarlyLeave = new Date(attendence.date);
  cutoffEarlyLeave.setHours(19, 0, 0, 0);

  if (checkIn) {
    if (checkIn > cutoffHalfDay) {
      attendence.checkInStatus = "halfDay";
    } else if (checkIn > cutoffLate) {
      attendence.checkInStatus = "late";
    } else {
      attendence.checkInStatus = "present";
    }
  }

  if (checkOut) {
    if (checkOut < cutoffEarlyLeave) {
      attendence.checkOutStatus = "early";
    } else {
      attendence.checkOutStatus = "present";
    }
  }
};

const evaluateAttendanceState = (attendance) => {
  const { checkIn, checkOut } = attendance;

  if (checkIn && !checkOut) {
    return "checkedInOnly";
  }

  if (!checkIn && checkOut) {
    return "checkedOutOnly";
  }

  if (!checkIn && !checkOut) {
    return "absent";
  }

  if (checkIn && checkOut) {
    return "completeEntry";
  }

  return "Unknown";
};

const calculateAttendanceSummary = (records) => {
  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    early: 0,
    halfDay: 0,
    totalWorkingDays: 0,
  };

  const uniqueDates = new Set();

  records.forEach((record) => {
    // Count checkInStatus
    if (record.checkInStatus === "present") summary.present += 1;
    else if (record.checkInStatus === "late") summary.late += 1;
    else if (record.checkInStatus === "halfDay") summary.halfDay += 1;
    else if (record.checkInStatus === "absent") summary.absent += 1;
    else if (record.checkOutStatus === "early") summary.early += 1;

    // Add date to set
    const dateKey = new Date(record.date).toDateString(); // normalize to string date
    uniqueDates.add(dateKey);
  });

  summary.totalWorkingDays = uniqueDates.size;

  return summary;
};

const calculateSummaryPerUser = (records) => {
  const summaryMap = new Map();

  records.forEach((record) => {
    const userId = record.user._id.toString();
    const userName = record.user.name;
    const dateKey = new Date(record.date).toDateString();

    if (!summaryMap.has(userId)) {
      summaryMap.set(userId, {
        userId,
        name: userName,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        totalWorkingDaysSet: new Set(), // store unique dates
      });
    }

    const userSummary = summaryMap.get(userId);

    // Count statuses
    if (record.checkInStatus === "present") userSummary.present += 1;
    else if (record.checkInStatus === "late") userSummary.late += 1;
    else if (record.checkInStatus === "halfDay") userSummary.halfDay += 1;
    else if (record.checkInStatus === "absent") userSummary.absent += 1;
    else if (record.checkOutStatus === "early") userSummary.early += 1;

    userSummary.totalWorkingDaysSet.add(dateKey); // add date
  });

  // Convert Set to count
  const finalSummary = [...summaryMap.values()].map((entry) => ({
    ...entry,
    totalWorkingDays: entry.totalWorkingDaysSet.size,
    totalWorkingDaysSet: undefined, // remove internal field
  }));

  return finalSummary;
};

const buildMonthlyDateFilter = (month) => {
  if (!month) return {}; // No filter if month not passed

  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1); // e.g., Aug 1
  const end = new Date(year, monthIndex, 0, 23, 59, 59, 999); // Last day of month

  return { date: { $gte: start, $lte: end } };
};

const checkIn = async (req, res, next) => {
  try {
    const { location } = req.body;
    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
      return res.status(400).json({ message: "Invalid location data" });
    }

    // Validate geofence
    const distance = getDistanceMeters(
      parseFloat(OFFICE_LAT),
      parseFloat(OFFICE_LNG),
      location.latitude,
      location.longitude
    );

    if (distance > parseFloat(OFFICE_RADIUS_METERS)) {
      return res
        .status(400)
        .json({ message: "Check-in Denied. You are not in the office" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let attendance = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });

    if (!attendance) {
      attendance = new Attendance({
        user: req.user._id,
        date: today,
      });
    }

    if (attendance.checkIn) {
      return res.status(400).json({ error: "Already checked in for today" });
    }

    attendance.checkIn = now;
    attendance.updatedBy = req.user._id;

    applyBusinessRule(attendance);
    const state = evaluateAttendanceState(attendance);
    attendance.state = state;
    await attendance.save();

    const io = req.app.get("io");
    io.emit("attendance:sync");

    res.status(200).json({ message: "Check-in successful", attendance });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const { location } = req.body;
    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
      return res.status(400).json({ message: "Invalid location data" });
    }

    // Validate geofence
    const distance = getDistanceMeters(
      parseFloat(OFFICE_LAT),
      parseFloat(OFFICE_LNG),
      location.latitude,
      location.longitude
    );

    if (distance > parseFloat(OFFICE_RADIUS_METERS)) {
      return res
        .status(400)
        .json({ message: "Check-Out Denied. You are not in the office" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let attendance = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });

    if (!attendance) {
      attendance = new Attendance({
        user: req.user._id,
        date: today,
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: "Already checked out for today" });
    }

    attendance.checkOut = now;
    attendance.updatedBy = req.user._id;

    applyBusinessRule(attendance);

    if (attendance.checkIn && attendance.checkOut) {
      const msDiff = attendance.checkOut - attendance.checkIn;
      attendance.totalHours = parseFloat(
        (msDiff / (1000 * 60 * 60)).toFixed(2)
      ); // rounded to 2 decimals
    }

    const state = evaluateAttendanceState(attendance);
    attendance.state = state;
    await attendance.save();
    const io = req.app.get("io");
    io.emit("attendance:sync");

    res.status(200).json({ message: "Check-Out successful", attendance });
  } catch (error) {
    next(error);
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { month } = req.query;
    const dateFilter = buildMonthlyDateFilter(month);
    const attendances = await Attendance.find(dateFilter).populate(
      "user",
      "name"
    );
    const summary = calculateSummaryPerUser(attendances);

    res.status(200).json({
      summary,
      attendances,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const { month } = req.query;
    const dateFilter = buildMonthlyDateFilter(month);
    const attendances = await Attendance.find({
      user: req.user._id,
      ...dateFilter,
    });
    const summary = calculateAttendanceSummary(attendances);

    res.status(200).json({
      summary,
      attendances,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });

    res.status(200).json({ attendance: record || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch today's attendance" });
  }
};

const updateAttendance = async (req, res) => {};
const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include full day

    const records = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).populate("user", "name email");

    if (!records.length) {
      return res
        .status(404)
        .json({ message: "No records found for the given date range" });
    }

    // Format data for CSV
    const exportData = records.map((r) => ({
      Name: r.user.name,
      Email: r.user.email || "",
      Date: r.date.toISOString().split("T")[0],
      CheckIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—",
      CheckOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—",
      CheckInStatus: r.checkInStatus,
      CheckOutStatus: r.checkOutStatus,
      TotalHours: r.totalHours,
    }));

    const fields = [
      "Name",
      "Email",
      "Date",
      "CheckIn",
      "CheckOut",
      "CheckInStatus",
      "CheckOutStatus",
      "TotalHours",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(exportData);

    res.header("Content-Type", "text/csv");
    res.attachment(`Attendance-${startDate}-to-${endDate}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllAttendance,
  checkIn,
  checkOut,
  getMyAttendance,
  updateAttendance,
  exportAttendance,
  getTodayAttendance,
};
