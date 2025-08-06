// cron-job.js
const cron = require("node-cron");
const moment = require("moment-timezone");
const Attendance = require("../models/attendanceModel");
const User = require("../models/User");

// Runs daily at 00:00 IST
cron.schedule("0 0 * * *", async () => {
  const tz = "Asia/Kolkata";
  // const yStart = moment.tz(tz).startOf("day").subtract(1, "day").toDate();
  const yesterdayMoment = moment.tz(tz).startOf("day").subtract(1, "day");

  if (yesterdayMoment.day() === 0) {
    console.log("⏭ Skipping attendance marking for Sunday");
    return;
  }

  const yStart = yesterdayMoment.toDate();

  try {
    const users = await User.find(
      { role: { $ne: "superAdmin" } }, // not equal to superAdmin
      "_id name role"
    );
    for (const u of users) {
      await Attendance.updateOne(
        { user: u._id, date: yStart },
        {
          $setOnInsert: {
            user: u._id,
            date: yStart,
            checkInStatus: "absent",
            checkOutStatus: "absent",
            state: "absent",
            updatedBy: u._id,
          },
        },
        { upsert: true }
      );
    }

    if (res.upsertedCount > 0) {
      console.log(`➕ Marked absent for ${u.name}`);
    } else {
      console.log(`ℹ Already has record for ${u.name}`);
    }
  } catch (err) {
    console.error("Absent cron error:", err);
  }
});
