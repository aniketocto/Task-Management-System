// testAbsentFill.bulk.js
require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const Attendance = require("../models/attendanceModel");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const tz = "Asia/Kolkata";
    const y = moment.tz(tz).startOf("day").subtract(1, "day");
    const yDate = y.toDate();
    console.log("📅 Marking absents for:", y.format("YYYY-MM-DD"));

    const users = await User.find({ role: { $ne: "superAdmin" } }, "_id name").lean();

    // build one bulkWrite with upserts
    const ops = users.map((u) => ({
      updateOne: {
        filter: { user: u._id, date: yDate },
        update: {
          $setOnInsert: {
            user: u._id,
            date: yDate,
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
    console.log(`✅ Bulk summary → inserted: ${inserted}, existing: ${skipped}`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
})();
