const mongoose = require("mongoose");
const Task = require("../models/Task"); // Adjust path if needed
const Leads = require("../models/Leads");
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

const backfillTaskApprovals = async () => {
  const tasks = await Task.find();

  let updatedTasksCount = 0;
  let updatedChecklistItemsCount = 0;

  for (const task of tasks) {
    let taskUpdated = false;

    const isCompletedOrDelayed =
      task.status === "completed" || task.status === "delayed";

    // ---- Main approvals ----
    if (!task.clientApproval) {
      task.clientApproval = isCompletedOrDelayed
        ? {
            status: "approved",
            approvedBy: task.createdBy || null,
            approvedAt: task.updatedAt || new Date(),
          }
        : { status: "pending" };
      taskUpdated = true;
    }

    if (!task.superAdminApproval) {
      task.superAdminApproval = isCompletedOrDelayed
        ? {
            status: "approved",
            approvedBy: task.createdBy || null,
            approvedAt: task.updatedAt || new Date(),
          }
        : { status: "pending" };
      taskUpdated = true;
    }

    // ---- Checklist approvals ----
    let updatedChecklist = task.todoChecklist.map((item) => {
      if (!item.approval) {
        updatedChecklistItemsCount++;
        taskUpdated = true;
        return {
          ...item.toObject(),
          approval: isCompletedOrDelayed
            ? {
                status: item.completed ? "approved" : "pending",
                approvedBy: task.createdBy || null,
                approvedAt: task.updatedAt || new Date(),
              }
            : { status: "pending" },
        };
      }
      return item;
    });

    task.todoChecklist = updatedChecklist;

    if (taskUpdated) {
      await task.save();
      updatedTasksCount++;
    }
  }

  console.log(`✅ Task approval fields backfilled.`);
  console.log(`🔢 Total tasks updated: ${updatedTasksCount}`);
  console.log(`🧾 Checklist items updated: ${updatedChecklistItemsCount}`);
};

const backfillPitchAndPresentation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    const leads = await Leads.find({
      $or: [
        { pitchDate: { $exists: true } },
        { "attachments.presentationUrl": { $exists: true } },
      ],
    });

    let updatedCount = 0;

    for (const lead of leads) {
      let modified = false;

      // ✅ Copy legacy pitchDate into new pitchDates
      const legacyPitchDate = lead.get("pitchDate");
      if (legacyPitchDate) {
        lead.pitchDates = [legacyPitchDate];
        lead.set("pitchDate", undefined); // remove old field
        modified = true;
      }

      // ✅ Copy legacy presentationUrl into new presentationUrls
      const legacyPresentationUrl = lead.attachments?.presentationUrl;
      if (
        typeof legacyPresentationUrl === "string" &&
        legacyPresentationUrl.trim() !== ""
      ) {
        if (
          !Array.isArray(lead.attachments.presentationUrls) ||
          lead.attachments.presentationUrls.length === 0
        ) {
          lead.attachments.presentationUrls = [legacyPresentationUrl];
          delete lead.attachments.presentationUrl;
          modified = true;
        }
      }

      if (modified) {
        await lead.save({ validateBeforeSave: false }); // to skip contact/email/etc. checks
        updatedCount++;
        console.log(`✅ Lead updated: ${lead._id}`);
      }
    }

    console.log(`🎉 Backfill complete. Total leads updated: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Backfill error:", err);
    process.exit(1);
  }
};

const migrateApprovalToLogs = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const tasks = await Task.find({});
  let updatedCount = 0;

  for (const task of tasks) {
    let changed = false;

    for (const item of task.todoChecklist) {
      if (
        item.approval &&
        ["approved", "rejected"].includes(item.approval.status) &&
        item.approval.approvedBy
      ) {
        item.approvalLogs = item.approvalLogs || [];
        // Check if this approval is already in logs (avoid duplicates)
        const alreadyLogged = item.approvalLogs.some(
          (log) =>
            log.status === item.approval.status &&
            log.admin?.toString() === item.approval.approvedBy.toString() &&
            new Date(log.date).getTime() ===
              new Date(item.approval.approvedAt).getTime()
        );

        if (!alreadyLogged) {
          // Add this as the "first" log
          item.approvalLogs.unshift({
            status: item.approval.status,
            admin: item.approval.approvedBy,
            date: item.approval.approvedAt || new Date(),
          });
          // Optionally trim to 3 latest
          if (item.approvalLogs.length > 3) {
            item.approvalLogs = item.approvalLogs.slice(-3);
          }
          changed = true;
        }
      }
    }
    if (changed) {
      await task.save({ validateBeforeSave: false });
      updatedCount++;
    }
  }
  console.log(`✅ Approval migration complete. Updated ${updatedCount} tasks.`);
  mongoose.disconnect();
};

const updateService = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const cursor = Leads.find({ services: { $type: "string" } }).cursor();
  for await (const doc of cursor) {
    doc.services = doc.services ? [doc.services] : [];
    await doc.save({ validateBeforeSave: false });
  }
  console.log("Migration complete");
};

module.exports = {
  updateExistingTasksWithSerials,
  backfillTaskApprovals,
  backfillPitchAndPresentation,
  migrateApprovalToLogs,
  updateService,
};
