const moment = require("moment-timezone");
const Holiday = require("../models/Holiday");
const { toISTStart, TZ } = require("../utils/holidays");

const createHoliday = async (req, res) => {
  try {
    const { label, date } = req.body;
    if (!label || !date)
      return res.status(400).json({ message: "Label and date are required" });

    const dayStart = toISTStart(date);

    const holiday = await Holiday.create({
      label: String(label).trim(),
      date: dayStart,
    });

    return res.status(201).json({
      message: "Holiday created successfully",
      holiday,
      localDateIST: moment.tz(holiday.date, TZ).format("YYYY-MM-DD"),
    });
    
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const listHolidays = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.json({ holidays: [] });

    const start = moment.tz(month, "YYYY-MM", TZ).startOf("month").toDate();
    const end = moment.tz(month, "YYYY-MM", TZ).endOf("month").toDate();
    const holidays = await Holiday.find({ date: { $gte: start, $lte: end } })
      .sort({ date: 1 })
      .lean();

    res.status(200).json({ holidays });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const removed = await Holiday.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Holiday deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};

module.exports = { createHoliday, listHolidays, deleteHoliday };
