const moment = require("moment-timezone");

const Holiday = require("../models/Holiday");
const TZ = "Asia/Kolkata";

const toISTStart = (d) => moment.tz(d, TZ).startOf("day").toDate();

const isHoliday = async (date) => {
  const start = toISTStart(date);
  const end = moment.tz(start, TZ).endOf("day").toDate();
  return !!(await Holiday.exists({ date: { $gte: start, $lte: end } }));
};

module.exports = { isHoliday, toISTStart, TZ };
