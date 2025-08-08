require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const Attendence = require("../models/attendanceModel");
const User = require("../models/User");

(async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // 2. Get yesterday's date in IST (midnight)
    const tz = "Asia/Kolkata";
    const yesterday = moment.tz(tz).startOf("day").subtract(1, "day").toDate();
    console.log(
      "📅 Marking absents for:",
      moment(yesterday).format("YYYY-MM-DD")
    );

    // 3. Fetch all users
    const users = await User.find(
      { role: { $ne: "superAdmin" } }, // not equal to superAdmin
      "_id name role"
    );
    // 4. Mark absent if no record exists
    for (const u of users) {
      const res = await Attendence.updateOne(
        { user: u._id, date: yesterday }, // match unique index
        {
          $setOnInsert: {
            user: u._id,
            date: yesterday,
            checkInStatus: "absent",
            checkOutStatus: "absent",
            state: "absent",
            updatedBy: u._id,
          },
        },
        { upsert: true }
      );

      if (res.upsertedCount > 0) {
        console.log(`➕ Marked absent for ${u.name}`);
      } else {
        console.log(`ℹ Already has record for ${u.name}`);
      }
    }

    // 5. Close DB
    await mongoose.disconnect();
    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
