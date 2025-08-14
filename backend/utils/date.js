const moment = require("moment");
const TZ = "Asia/Kolkata";

function startOfDayIST(date = new Date()) {
  return moment.tz(date, TZ).startOf("day").toDate();
}

module.exports = { startOfDayIST };