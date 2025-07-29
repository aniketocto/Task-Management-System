const mongoose = require("mongoose");
const Task = require("../models/Task"); // Adjust path if needed
require("dotenv").config();

const updateExistingTasksWithSerials = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const tasks = await Task.find({ serialNumber: { $exists: false } }).sort({
      createdAt: 1,
    });

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      // 🧠 Skip tasks that are incomplete
      if (!task.companyName) {
        console.warn(`⚠️ Skipping task ${task._id} (missing companyName)`);
        continue;
      }

      const serial = `U${String(i + 1).padStart(3, "0")}`;
      task.serialNumber = serial;
      await task.save();
      console.log(`✅ Updated task ${task._id} → ${serial}`);
    }

    console.log("🎉 All tasks updated with serial numbers");
  } catch (err) {
    console.error("❌ Error updating tasks:", err);
  }
};

module.exports = updateExistingTasksWithSerials;
