const { Parser } = require("json2csv");
const {
  getDistanceMeters,
  OFFICE_LAT,
  OFFICE_LNG,
  OFFICE_RADIUS_METERS,
} = require("../config/geofence");
const Attendance = require("../models/attendanceModel");

const { startOfDayIST } = require("../utils/date");
const Holiday = require("../models/Holiday");
const { TZ } = require("../utils/holidays");
const moment = require("moment-timezone");

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

const isPresentLike = (record) => {
  return ["present", "late", "halfDay", "onTime"].includes(
    record.checkInStatus
  );
};

const isAbsent = (record) => {
  return !record.checkIn && !record.checkOut;
};

const isWorkingDay = (record) => {
  return !!(record.checkIn || record.checkOut);
};

const calculateUnifiedSummary = (records) => {
  const summaryMap = new Map();
  const weeklyLateCount = {};

  records.forEach((record) => {
    const hasUser = !!record.user && !!record.user._id;
    const userId = hasUser ? String(record.user._id) : "unassigned";

    const dateKey = new Date(record.date).toDateString();
    const weekNum = moment(record.date).isoWeek();
    const weekKey = `${userId} - ${weekNum}`;

    if (!summaryMap.has(userId)) {
      summaryMap.set(userId, {
        userId,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        early: 0,
        ruleAppliedHalfDays: 0,
        totalWorkingDaysSet: new Set(),
      });
    }

    const userSummary = summaryMap.get(userId);

    // Present
    if (isPresentLike(record) || (record.checkIn && !record.checkOut)) {
      userSummary.present++;
    }

    // Absent
    if (isAbsent(record)) {
      userSummary.absent++;
    }

    // Late
    if (record.checkInStatus === "late") {
      userSummary.late++;
      weeklyLateCount[weekKey] = (weeklyLateCount[weekKey] || 0) + 1;
    }

    // Half-day
    if (record.checkInStatus === "halfDay") {
      userSummary.halfDay++;
    }

    // Early checkout
    if (record.checkOutStatus === "early") {
      userSummary.early++;
    }

    // Working days
    if (isWorkingDay(record)) {
      userSummary.totalWorkingDaysSet.add(dateKey);
    }
  });

  Object.keys(weeklyLateCount).forEach((wk) => {
    if (weeklyLateCount[wk] >= 3) {
      const [uid] = wk.split("-");
      const us = summaryMap.get(uid);
      if (us) {
        us.ruleAppliedHalfDays += 1;
      }
    }
  });

  // Convert sets to counts
  const finalSummary = [...summaryMap.values()].map((entry) => ({
    ...entry,
    totalWorkingDays: entry.totalWorkingDaysSet.size,
    totalWorkingDaysSet: undefined,
    halfDayTotal: entry.halfDay + entry.ruleAppliedHalfDays,
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
        .json({ error: "Check-in Denied. You are not in the office" });
    }

    const now = new Date();
    const today = startOfDayIST();

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
    const today = startOfDayIST();

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
    const attendances = await Attendance.find(dateFilter)
      .sort({ date: 1 })
      .populate({
        path: "user",
        select: "name role",
        match: { role: { $ne: "superAdmin" } },
      })
      .lean();
    const filtered = attendances.filter((a) => a.user !== null);
    const summary = calculateUnifiedSummary(filtered);

    if (month) {
      const mStart = moment.tz(month, "YYYY-MM", TZ).startOf("month").toDate();
      const mEnd = moment.tz(month, "YYYY-MM", TZ).endOf("month").toDate();

      var holidays = await Holiday.find({
        date: { $gte: mStart, $lte: mEnd },
      })
        .sort({ date: 1 })
        .lean();
    } else {
      var holidays = [];
    }

    res.status(200).json({
      summary,
      attendances,
      holidays,
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
    const summary = calculateUnifiedSummary(attendances);

    if (month) {
      const mStart = moment.tz(month, "YYYY-MM", TZ).startOf("month").toDate();
      const mEnd = moment.tz(month, "YYYY-MM", TZ).endOf("month").toDate();

      var holidays = await Holiday.find({
        date: { $gte: mStart, $lte: mEnd },
      })
        .sort({ date: 1 })
        .lean();
    } else {
      var holidays = [];
    }

    res.status(200).json({
      summary,
      attendances,
      holidays,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const today = startOfDayIST();
    const record = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });

    res.status(200).json({ attendance: record || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch today's attendance" });
  }
};

// attendanceControllers.js
const saveAttendanceAdmin = async (req, res) => {
  try {
    const { id, userId, date, checkIn, checkOut } = req.body;

    // validate required inputs
    if (!id && (!userId || !date)) {
      return res
        .status(400)
        .json({ message: "Provide either id OR (userId and date)" });
    }

    // Prevent attendance save if userId missing
    if (!id && !userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Prevent superAdmin attendance
    if (req.user?.role === "superAdmin" || req.body.role === "superAdmin") {
      return res
        .status(403)
        .json({ message: "SuperAdmin cannot mark attendance" });
    }

    // normalize date to start-of-day
    const dayStart = startOfDayIST(date ? new Date(date) : new Date());

    let doc;

    if (id) {
      // Update existing by id
      doc = await Attendance.findById(id);
      if (!doc) {
        return res.status(404).json({ message: "Attendance not found" });
      }

      if (date) doc.date = dayStart;
      if (typeof checkIn !== "undefined")
        doc.checkIn = checkIn ? new Date(checkIn) : null;
      if (typeof checkOut !== "undefined")
        doc.checkOut = checkOut ? new Date(checkOut) : null;

      doc.updatedBy = req.user._id;
    } else {
      // Upsert by (userId + date)
      doc = await Attendance.findOne({ user: userId, date: dayStart });
      if (!doc) {
        doc = new Attendance({
          user: userId,
          date: dayStart,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          updatedBy: req.user._id,
        });
      } else {
        if (typeof checkIn !== "undefined")
          doc.checkIn = checkIn ? new Date(checkIn) : null;
        if (typeof checkOut !== "undefined")
          doc.checkOut = checkOut ? new Date(checkOut) : null;
        doc.updatedBy = req.user._id;
      }
    }

    // recompute statuses / totalHours / state
    applyBusinessRule(doc);
    if (doc.checkIn && doc.checkOut) {
      const ms = doc.checkOut - doc.checkIn;
      doc.totalHours = parseFloat((ms / 36e5).toFixed(2));
    } else {
      doc.totalHours = 0;
    }
    doc.state = evaluateAttendanceState(doc);

    await doc.save();
    req.app.get("io")?.emit("attendance:sync");

    return res.json({ message: "Saved", attendance: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Another record exists for this user on that date" });
    }
    console.error(err);
    return res.status(500).json({ message: "Save failed" });
  }
};

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
      Date: moment.tz(r.date, TZ).format("YYYY-MM-DD"),
      CheckIn: r.checkIn ? moment.tz(r.checkIn, TZ).format("HH:mm") : "—",
      CheckOut: r.checkOut ? moment.tz(r.checkOut, TZ).format("HH:mm") : "—",
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
  saveAttendanceAdmin,
  exportAttendance,
  getTodayAttendance,
};
