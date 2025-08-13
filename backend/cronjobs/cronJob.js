const cron = require("node-cron");
const moment = require("moment-timezone");
const Attendance = require("../models/attendanceModel");
const User = require("../models/User");
const { isHoliday } = require("../utils/holidays");

cron.schedule(
  "0 0 * * *",
  async () => {
    const tz = "Asia/Kolkata";
    const yesterdayMoment = moment.tz(tz).startOf("day").subtract(1, "day");

    if (yesterdayMoment.day() === 0) {
      console.log("Skipping attendance marking for Sunday");
      return;
    }

    const yStart = yesterdayMoment.toDate();

    if (await isHoliday(yStart)) {
      console.log(
        `${yesterdayMoment.format(
          "YYYY-MM-DD"
        )} is a holiday - skipping attendance marking`
      );
      return;
    }
    try {
      const users = await User.find(
        { role: { $ne: "superAdmin" } },
        "_id name role"
      );

      if (users.length === 0) {
        console.log("No users to mark absent");
        return;
      }
      const ops = users.map((u) => ({
        updateOne: {
          filter: { user: u._id, date: yStart },
          update: {
            $setOnInsert: {
              user: u._id,
              date: yStart,
              checkInStatus: "absent",
              checkOutStatus: "absent",
              state: "absent",
              updatedBy: u._id,
            },
          },
          upsert: true,
        },
      }));

      const result = await Attendance.bulkWrite(ops, { ordered: false });

      const inserted = result.upsertedCount || 0;
      const skipped = users.length - inserted;
      console.log(
        `✅ Absent cron: inserted ${inserted}, existing ${skipped} for ${yStart.format(
          "YYYY-MM-DD"
        )}`
      );
    } catch (err) {
      console.error("Absent cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" }
);
