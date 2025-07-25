const Notification = require("../models/Notification");
const Task = require("../models/Task");
const User = require("../models/User");

const getTasks = async (req, res) => {
  try {
    const {
      department,
      status,
      month, // e.g. "2025-06"
      timeframe, // new: "today" | "yesterday" | "last7Days" | "custom"
      startDate, // new: ISO date string, e.g. "2025-07-20"
      endDate, // new: ISO date string, e.g. "2025-07-20"
      page = 1,
      limit = 10,
      sortOrder = "desc",
      sortBy = "createdAt",
      priority,
      fields,
    } = req.query;

    // === figure out which sections to include ===
    const allSections = [
      "tasks",
      "statusSummary",
      "monthlyData",
      "availableMonths",
      "departmentSummary",
      "userBreakdown",
    ];
    const include = fields
      ? fields.split(",").map((f) => f.trim())
      : allSections;

    // === build your filter & pagination ===
    const skip = (page - 1) * limit;
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const now = new Date();
    if (timeframe) {
      switch (timeframe) {
        case "today":
          filter.createdAt = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lte: now,
          };
          break;

        case "yesterday":
          const yd = new Date(now);
          yd.setDate(now.getDate() - 1);
          filter.createdAt = {
            $gte: new Date(yd.getFullYear(), yd.getMonth(), yd.getDate()),
            $lte: new Date(
              yd.getFullYear(),
              yd.getMonth(),
              yd.getDate(),
              23,
              59,
              59,
              999
            ),
          };
          break;

        case "last7Days":
          const last7 = new Date(now);
          last7.setDate(now.getDate() - 7);
          filter.createdAt = { $gte: last7, $lte: now };
          break;

        case "custom":
          if (startDate && !endDate) {
            const from = new Date(startDate);
            const to = new Date(startDate);
            to.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: from, $lte: to };
          } else if (!startDate && endDate) {
            const to = new Date(endDate);
            const from = new Date(endDate);
            from.setHours(0, 0, 0, 0);
            filter.createdAt = { $gte: from, $lte: to };
          } else if (startDate && endDate) {
            const from = new Date(startDate);
            const to = new Date(endDate);
            to.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: from, $lte: to };
          }
          break;

        default:
          break;
      }
    } else if (month) {
      const [y, m] = month.split("-");
      filter.createdAt = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999),
      };
    }

    // === department ACL ===
    const isPrivileged = ["admin", "superAdmin"].includes(req.user.role);
    let baseFilter = isPrivileged
      ? {}
      : {
          $or: [
            { assignedTo: { $in: [req.user._id] } },
            { "todoChecklist.assignedTo": req.user._id },
          ],
        };

    if (department) {
      const usersInDept = await User.find({ department }).select("_id");
      const deptIds = usersInDept.map((u) => u._id);
      if (!isPrivileged) {
        // non-privileged only see their own tasks
        if (!deptIds.some((id) => id.equals(req.user._id))) return res.json({});
        filter.assignedTo = { $in: [req.user._id] };
      } else {
        filter.assignedTo = { $in: deptIds };
      }
    } else {
      filter = { ...filter, ...baseFilter };
    }

    // === fetch the raw Task documents ===
    let tasks = await Task.find(filter)
      .populate("assignedTo", "name email profileImageUrl department")
      .sort(
        sortBy === "dueDate"
          ? { dueDate: sortOrder === "asc" ? 1 : -1, createdAt: -1 }
          : { createdAt: sortOrder === "asc" ? 1 : -1 }
      )
      .skip(skip)
      .limit(Number(limit));

    //
    // ─── A ─── RECALCULATE & PERSIST EACH TASK’S PROGRESS + STATUS ───
    //
    await Promise.all(
      tasks.map(async (taskDoc) => {
        // 1) completed vs total checklist items → progress%
        const completedCount = taskDoc.todoChecklist.filter(
          (i) => i.completed
        ).length;
        const totalItems = taskDoc.todoChecklist.length;
        const newProgress =
          totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        // 2) determine newStatus by comparing now vs dueDate end-of-day
        const now = new Date();
        const dueDateEnd = new Date(taskDoc.dueDate);
        dueDateEnd.setHours(23, 59, 59, 999);

        let newStatus;
        if (newProgress === 100) {
          newStatus = now > dueDateEnd ? "delayed" : "completed";
        } else if (now > dueDateEnd) {
          newStatus = "pending";
        } else if (newProgress > 0) {
          newStatus = "inProgress";
        } else {
          newStatus = "new";
        }

        // 3) if anything changed, write it back
        if (taskDoc.progress !== newProgress || taskDoc.status !== newStatus) {
          taskDoc.progress = newProgress;
          taskDoc.status = newStatus;
          await taskDoc.save();
        }
      })
    );

    //
    // ─── B ─── TRANSFORM FOR RESPONSE ───
    //
    // now that DB is in sync, we re-map to plain objects including completed count
    const transformed = tasks.map((t) => ({
      ...t._doc,
      completedTodoCount: t.todoChecklist.filter((c) => c.completed).length,
    }));

    // 1) tasks + pagination
    const totalCount = include.includes("tasks")
      ? await Task.countDocuments(filter)
      : undefined;

    const result = { tasks: transformed, totalCount };

    // 2) statusSummary (re-query now that statuses are current)
    if (include.includes("statusSummary")) {
      const countWith = (s) => Task.countDocuments({ ...filter, status: s });
      const [
        allTasks,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        delayedTasks,
      ] = await Promise.all([
        Task.countDocuments(filter),
        countWith("new"),
        countWith("pending"),
        countWith("inProgress"),
        countWith("completed"),
        countWith("delayed"),
      ]);
      result.statusSummary = {
        all: allTasks,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        delayedTasks,
      };
    }

    // 3) & 4) monthlyData & availableMonths (unchanged)
    let fullMonthlyData;
    if (
      include.includes("monthlyData") ||
      include.includes("availableMonths")
    ) {
      fullMonthlyData = await getEnhancedMonthlyTaskData(
        isPrivileged ? {} : { assignedTo: { $in: [req.user._id] } },
        department
      );
    }
    if (include.includes("availableMonths")) {
      result.availableMonths = fullMonthlyData.monthsData.map((m) => ({
        label: m.label,
        value: m.value,
      }));
    }
    if (include.includes("departmentSummary")) {
      const deptSummary = await getDepartmentBreakdown(filter);
      result.departmentSummary = deptSummary;
    }

    // userBreakdown (respects filter + optional department)
    if (include.includes("userBreakdown")) {
      const userSummary = await getUserBreakdown(filter, department);
      result.userBreakdown = userSummary;
    }
    if (include.includes("monthlyData")) {
      if (month) {
        const only = fullMonthlyData.monthsData.filter(
          (m) => m.value === month
        );
        const totalForMonth = only.reduce((sum, m) => sum + m.count, 0);
        result.monthlyData = { monthsData: only, allTimeTotal: totalForMonth };
      } else {
        result.monthlyData = fullMonthlyData;
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getEnhancedMonthlyTaskData = async (
  baseFilter,
  departmentFilter = null
) => {
  const monthsData = [];

  const earliestTask = await Task.findOne(baseFilter).sort({ createdAt: 1 });
  const startDate = earliestTask?.createdAt || new Date();
  const now = new Date();

  const totalMonths =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  for (let i = totalMonths; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      1
    );

    let gte = monthDate;
    let lt = nextMonthDate;
    if (baseFilter.createdAt) {
      const { $gte: fGte, $lte: fLte } = baseFilter.createdAt;
      lt = fLte && fLte < nextMonthDate ? fLte : nextMonthDate; // if your timeframe had an upper‐bound, use that instead of month’s end
      gte = fGte && fGte > monthDate ? fGte : monthDate; // if your timeframe had a lower‐bound, use that instead of month’s star
    }

    const monthFilter = {
      ...baseFilter,
      createdAt: { $gte: gte, $lt: lt },
    };

    const monthLabel = monthDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

    const monthValue = `${monthDate.getFullYear()}-${String(
      monthDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const countWith = (status) =>
      Task.countDocuments({ ...monthFilter, status });

    const [
      all,
      newTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      delayedTasks,
    ] = await Promise.all([
      Task.countDocuments(monthFilter),
      countWith("new"),
      countWith("pending"),
      countWith("inProgress"),
      countWith("completed"),
      countWith("delayed"),
    ]);

    // Priority breakdown
    const priorities = ["high", "medium", "low"];
    const priorityCounts = {};
    await Promise.all(
      priorities.map(async (priority) => {
        priorityCounts[priority] = await Task.countDocuments({
          ...monthFilter,
          priority,
        });
      })
    );

    // Department breakdown for this month
    const departmentBreakdown = await getDepartmentBreakdown(monthFilter);

    // User breakdown for this month
    const userBreakdown = await getUserBreakdown(monthFilter, departmentFilter);

    monthsData.push({
      label: monthLabel,
      value: monthValue,
      count: all,
      statusBreakdown: {
        all,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        delayedTasks,
      },
      priorityBreakdown: {
        ...priorityCounts,
      },
      departmentBreakdown,
      userBreakdown,
      charts: {
        taskDistribution: {
          new: newTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          delayed: delayedTasks,
          All: all,
        },
        taskPrioritiesLevels: {
          high: priorityCounts.high,
          medium: priorityCounts.medium,
          low: priorityCounts.low,
        },
        departmentDistribution: departmentBreakdown,
      },
    });
  }

  // Total count outside of months
  const totalAllTasks = await Task.countDocuments(baseFilter);

  return {
    monthsData,
    allTimeTotal: totalAllTasks,
  };
};

const getDepartmentBreakdown = async (monthFilter) => {
  const pipeline = [
    { $match: monthFilter },
    { $unwind: "$assignedTo" },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $group: {
        _id: "$user.department",
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "inProgress"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        delayed: { $sum: { $cond: [{ $eq: ["$status", "delayed"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
  ];

  const results = await Task.aggregate(pipeline);

  const breakdown = {};
  results.forEach((dept) => {
    breakdown[dept._id || "Unknown"] = {
      total: dept.total,
      statusBreakdown: {
        new: dept.new,
        pending: dept.pending,
        inProgress: dept.inProgress,
        completed: dept.completed,
        delayed: dept.delayed,
      },
      priorityBreakdown: {
        high: dept.high,
        medium: dept.medium,
        low: dept.low,
      },
      charts: {
        taskDistribution: {
          new: dept.new,
          pending: dept.pending,
          inProgress: dept.inProgress,
          completed: dept.completed,
          delayed: dept.delayed,
          All: dept.total,
        },
        taskPrioritiesLevels: {
          high: dept.high,
          medium: dept.medium,
          low: dept.low,
        },
      },
    };
  });

  return breakdown;
};

const getUserBreakdown = async (monthFilter, departmentFilter = null) => {
  const pipeline = [
    { $match: monthFilter },
    { $unwind: "$assignedTo" },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];

  // Add department filter if specified
  if (departmentFilter) {
    pipeline.push({
      $match: { "user.department": departmentFilter },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          userId: "$user._id",
          userName: "$user.name",
          userEmail: "$user.email",
          userDepartment: "$user.department",
        },
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "inProgress"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        delayed: { $sum: { $cond: [{ $eq: ["$status", "delayed"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } }
  );

  const results = await Task.aggregate(pipeline);

  const breakdown = {};
  results.forEach((user) => {
    breakdown[user._id.userId] = {
      name: user._id.userName,
      email: user._id.userEmail,
      department: user._id.userDepartment,
      total: user.total,
      statusBreakdown: {
        new: user.new,
        pending: user.pending,
        inProgress: user.inProgress,
        completed: user.completed,
        delayed: user.delayed,
      },
      priorityBreakdown: {
        high: user.high,
        medium: user.medium,
        low: user.low,
      },
      charts: {
        taskDistribution: {
          new: user.new,
          pending: user.pending,
          inProgress: user.inProgress,
          completed: user.completed,
          delayed: user.delayed,
          All: user.total,
        },
        taskPrioritiesLevels: {
          high: user.high,
          medium: user.medium,
          low: user.low,
        },
      },
    };
  });

  return breakdown;
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAdminTasks = async (req, res) => {
  try {
    const {
      status,
      month, // e.g. "2025-06"
      page = 1,
      limit = 12,
      sortOrder = "desc",
      sortBy = "createdAt",
      priority,
      fields, // e.g. "tasks,statusSummary,monthlyData,availableMonths"
    } = req.query;

    // Which sections to return:
    const allSections = [
      "tasks",
      "statusSummary",
      "monthlyData",
      "availableMonths",
    ];
    const include = fields
      ? fields.split(",").map((f) => f.trim())
      : allSections;

    // Base filter: only tasks assigned to this admin
    const skip = (page - 1) * limit;
    let filter = { assignedTo: req.user._id };

    // Apply optional filters:
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (month) {
      const [y, m] = month.split("-");
      filter.createdAt = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999),
      };
    }

    const result = {};

    // 1) tasks + pagination
    if (include.includes("tasks")) {
      const tasks = await Task.find(filter)
        .populate("assignedTo", "name email profileImageUrl department")
        .sort(
          sortBy === "dueDate"
            ? { dueDate: sortOrder === "asc" ? 1 : -1, createdAt: -1 }
            : { createdAt: sortOrder === "asc" ? 1 : -1 }
        )
        .skip(skip)
        .limit(Number(limit));

      // add completedTodoCount
      result.tasks = tasks.map((t) => ({
        ...t._doc,
        completedTodoCount: t.todoChecklist.filter((c) => c.completed).length,
      }));
      result.totalCount = await Task.countDocuments(filter);
    }

    // 2) status summary
    if (include.includes("statusSummary")) {
      const countWith = (s) => Task.countDocuments({ ...filter, status: s });
      const [
        allTasks,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        delayedTasks,
      ] = await Promise.all([
        Task.countDocuments(filter),
        countWith("new"),
        countWith("pending"),
        countWith("inProgress"),
        countWith("completed"),
        countWith("delayed"),
      ]);

      result.statusSummary = {
        all: allTasks,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        delayedTasks,
      };
    }

    // 3) monthlyData & 4) availableMonths
    let fullMonthlyData;
    if (
      include.includes("monthlyData") ||
      include.includes("availableMonths")
    ) {
      fullMonthlyData = await getEnhancedMonthlyTaskData(
        { assignedTo: req.user._id },
        /* department = */ null
      );
    }

    if (include.includes("availableMonths")) {
      result.availableMonths = fullMonthlyData.monthsData.map((m) => ({
        label: m.label,
        value: m.value,
      }));
    }

    if (include.includes("monthlyData")) {
      if (month) {
        const only = fullMonthlyData.monthsData.filter(
          (m) => m.value === month
        );
        const totalForMonth = only.reduce((sum, m) => sum + m.count, 0);
        result.monthlyData = {
          monthsData: only,
          allTimeTotal: totalForMonth,
        };
      } else {
        result.monthlyData = fullMonthlyData;
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const mongoose = require("mongoose");

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      companyName,
      assignedTo,
      dueDate,
      priority,
      attachments,
      todoChecklist,
    } = req.body;

    // Ensure main task assignees is an array
    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "Assigned to must be an array of user IDs" });
    }

    // ✅ Validate todoChecklist entries if provided
    if (todoChecklist && Array.isArray(todoChecklist)) {
      for (const item of todoChecklist) {
        if (!item.text) {
          return res
            .status(400)
            .json({ message: "Each checklist item must have a text field." });
        }
        if (
          item.assignedTo &&
          !mongoose.Types.ObjectId.isValid(item.assignedTo)
        ) {
          return res
            .status(400)
            .json({ message: "Invalid assignedTo in checklist." });
        }
      }
    }

    // ✅ Create the task
    const task = await Task.create({
      title,
      description,
      companyName,
      assignedTo,
      dueDate,
      priority,
      attachments,
      todoChecklist,
      createdBy: req.user._id,
    });

    // 🔔 Notify assigned users
    const io = req.app.get("io");

    const notifications = await Promise.all(
      assignedTo.map(async (userId) => {
        return await Notification.create({
          user: userId,
          message: `You have been assigned a new task: ${task.title}`,
          taskId: task._id,
          type: "task",
        });
      })
    );

    // Emit notifications via socket.io
    notifications.forEach((notification) => {
      try {
        if (!notification || !notification.user) {
          console.warn(
            "⚠️ Skipped emitting notification due to missing user:",
            notification
          );
          return;
        }

        const room = notification.user.toString();
        io.to(room).emit("new-notification", notification);
      } catch (emitErr) {
        console.error("❌ Socket emit failed:", emitErr.message);
      }
      try {
        if (!notification || !notification.user) {
          console.warn(
            "⚠️ Skipped emitting notification due to missing user:",
            notification
          );
          return;
        }

        const room = notification.user.toString();
        io.to(room).emit("new-notification", notification);
      } catch (emitErr) {
        console.error("❌ Socket emit failed:", emitErr.message);
      }
    });
    res.json({ message: "Task & notifications created successfully", task });
  } catch (error) {
    console.error("❌ createTask error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const role = req.user.role;
    const oldAssigned = task.assignedTo.map((id) => id.toString());

    // ✅ If user, allow only checklist item completion
    if (role === "user") {
      if (req.body.todoChecklist) {
        task.todoChecklist = req.body.todoChecklist;
        const updatedTask = await task.save();
        return res.status(200).json({
          message: "Task updated successfully (todo checklist only)",
          task: updatedTask,
        });
      }
      return res
        .status(403)
        .json({ message: "Users can only update the todo checklist." });
    }

    // ✅ Common checklist validation if provided
    if (req.body.todoChecklist && Array.isArray(req.body.todoChecklist)) {
      for (const item of req.body.todoChecklist) {
        if (!item.text) {
          return res
            .status(400)
            .json({ message: "Each checklist item must have a text field." });
        }
        if (
          item.assignedTo &&
          !mongoose.Types.ObjectId.isValid(item.assignedTo)
        ) {
          return res
            .status(400)
            .json({ message: "Invalid assignedTo in checklist." });
        }
      }
    }

    // ✅ Admin can update all except dueDate
    if (role === "admin") {
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.companyName = req.body.companyName || task.companyName;
      task.priority = req.body.priority || task.priority;
      task.attachments = req.body.attachments || task.attachments;

      if (req.body.todoChecklist) {
        task.todoChecklist = req.body.todoChecklist;
      }

      if (req.body.assignedTo) {
        if (!Array.isArray(req.body.assignedTo)) {
          return res
            .status(400)
            .json({ message: "Assigned to must be an array of user IDs" });
        }
        task.assignedTo = req.body.assignedTo;
      }

      if (req.body.dueDate) {
        return res
          .status(403)
          .json({ message: "Only SuperAdmin can update due date." });
      }
    }

    // ✅ SuperAdmin can update everything
    if (role === "superAdmin") {
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.companyName = req.body.companyName || task.companyName;
      task.dueDate = req.body.dueDate || task.dueDate;
      task.priority = req.body.priority || task.priority;
      task.attachments = req.body.attachments || task.attachments;
      task.todoChecklist = req.body.todoChecklist || task.todoChecklist;

      if (req.body.assignedTo) {
        if (!Array.isArray(req.body.assignedTo)) {
          return res
            .status(400)
            .json({ message: "Assigned to must be an array of user IDs" });
        }
        task.assignedTo = req.body.assignedTo;
      }
    }

    // Now you’ve updated task.assignedTo in-memory—time to save
    const updatedTask = await task.save();

    if (req.body.assignedTo) {
      const newAssigned = updatedTask.assignedTo.map((id) => id.toString());
      const addedUsers = newAssigned.filter((id) => !oldAssigned.includes(id));

      if (addedUsers.length > 0) {
        const io = req.app.get("io");

        const notifications = await Promise.all(
          addedUsers.map(async (userId) => {
            if (!userId) return null;
            return await Notification.create({
              user: userId,
              message: `You have been newly assigned to task: ${updatedTask.title}`,
              taskId: updatedTask._id,
              type: "task",
            });
          })
        );

        notifications.forEach((notif) => {
          try {
            if (!notif || !notif.user) {
              console.warn("⚠️ Missing user in notification:", notif);
              return;
            }
            const room = notif.user.toString();
            io.to(room).emit("new-notification", notif);
          } catch (emitErr) {
            console.error("❌ Failed to emit notification:", emitErr.message);
          }
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("❌ updateTask error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task Delete Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedTo.some(
      (user) => user.toString() === req.user._id.toString()
    );

    if (
      !isAssigned &&
      req.user.role !== "superAdmin" &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this task." });
    }

    task.status = req.body.status;

    if (task.status === "completed") {
      task.todoChecklist.forEach((item) => {
        item.completed = true;
      });
      task.progress = 100;
    }

    await task.save();
    res.status(200).json({ message: "Task status updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned =
      task.assignedTo.some(
        (userId) => userId.toString() === req.user._id.toString()
      ) ||
      task.todoChecklist.some(
        (item) => item.assignedTo?.toString() === req.user._id.toString()
      );

    if (
      !isAssigned &&
      req.user.role !== "superAdmin" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not authorized to update the task checklist.",
      });
    }

    task.todoChecklist = todoChecklist;

    // Auto update progress based on completed items
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    const now = new Date();

    // Create a copy of dueDate at the end of the day
    const dueDateEnd = new Date(task.dueDate);
    dueDateEnd.setHours(23, 59, 59, 999);

    if (task.progress === 100) {
      if (now > dueDateEnd) {
        task.status = "delayed"; // completed, but late
      } else {
        task.status = "completed"; // completed on time
      }
    } else if (now > dueDateEnd) {
      task.status = "pending"; // overdue & not completed
    } else if (task.progress > 0) {
      task.status = "inProgress";
    } else {
      task.status = "new";
    }

    await task.save();

    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    res.status(200).json({
      message: "Task checklist updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const { timeframe, startDate, endDate } = req.query;
    const now = new Date();

    // === DATE FILTER ===
    let dateFilter = {};
    if (timeframe) {
      switch (timeframe) {
        case "today":
          dateFilter.createdAt = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lte: now,
          };
          break;

        case "yesterday":
          const yd = new Date(now);
          yd.setDate(now.getDate() - 1);
          dateFilter.createdAt = {
            $gte: new Date(yd.getFullYear(), yd.getMonth(), yd.getDate()),
            $lte: new Date(
              yd.getFullYear(),
              yd.getMonth(),
              yd.getDate(),
              23,
              59,
              59,
              999
            ),
          };
          break;

        case "last7Days":
          const last7 = new Date(now);
          last7.setDate(now.getDate() - 7);
          dateFilter.createdAt = { $gte: last7, $lte: now };
          break;

        case "custom":
          if (startDate && endDate) {
            dateFilter.createdAt = {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            };
          }
          break;

        default:
          break;
      }
    }

    // === ENHANCED FILTER (assignedTo or todoChecklist.assignedTo) ===
    const matchFilter = {
      ...dateFilter,
      $or: [
        { assignedTo: { $exists: true, $ne: [] } },
        { "todoChecklist.assignedTo": { $exists: true } },
      ],
    };

    // === BASIC STATS ===
    const totalTasks = await Task.countDocuments(matchFilter);
    const newTasks = await Task.countDocuments({
      ...matchFilter,
      status: "new",
    });
    const inProgressTasks = await Task.countDocuments({
      ...matchFilter,
      status: "inProgress",
    });
    const completedTasks = await Task.countDocuments({
      ...matchFilter,
      status: "completed",
    });
    const pendingTasks = await Task.countDocuments({
      ...matchFilter,
      status: "pending",
    });
    const delayedTasks = await Task.countDocuments({
      ...matchFilter,
      status: "delayed",
    });

    // === STATUS DISTRIBUTION ===
    const taskStatuses = [
      "new",
      "pending",
      "inProgress",
      "completed",
      "delayed",
    ];
    const taskDistributionRaw = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formatted = status.replace(/\s+/g, "");
      acc[formatted] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    // === PRIORITY DISTRIBUTION ===
    const taskPriorities = ["high", "medium", "low"];
    const taskPrioritiesLevelsRaw = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const taskPrioritiesLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPrioritiesLevelsRaw.find((item) => item._id === priority)?.count ||
        0;
      return acc;
    }, {});

    // === RECENT TASKS ===
    const recentTasks = await Task.find(matchFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select("companyName title status priority dueDate createdAt");

    // === MONTHLY DATA (pass matchFilter)
    const monthlyData = await getEnhancedMonthlyTaskData(matchFilter);

    // === FINAL RESPONSE ===
    res.status(200).json({
      statistic: {
        totalTasks,
        newTasks,
        inProgressTasks,
        completedTasks,
        pendingTasks,
        delayedTasks,
      },
      charts: {
        taskDistribution,
        taskPrioritiesLevels,
      },
      recentTasks,
      monthlyData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id; // Only to fetch data of logged-in user

    // Fetch statistics for the user
    const matchFilter = {
      $or: [{ assignedTo: userId }, { "todoChecklist.assignedTo": userId }],
    };

    const totalTasks = await Task.countDocuments(matchFilter);
    const newTasks = await Task.countDocuments({
      status: "new",
      assignedTo: userId,
    });
    const inProgressTasks = await Task.countDocuments({
      status: "inProgress",
      assignedTo: userId,
    });
    const completedTasks = await Task.countDocuments({
      status: "completed",
      assignedTo: userId,
    });
    const pendingTasks = await Task.countDocuments({
      status: "pending",
      assignedTo: userId,
    });
    const delayedTasks = await Task.countDocuments({
      status: "delayed",
      assignedTo: userId,
    });

    // Ensure all task status
    const taskStatuses = [
      "new",
      "pending",
      "inProgress",
      "completed",
      "delayed",
    ];

    const taskDistributionRaw = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    // Ensure all priority level
    const taskPriorities = ["high", "medium", "low"];
    const taskPrioritiesLevelsRaw = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const taskPrioritiesLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPrioritiesLevelsRaw.find((item) => item._id === priority)?.count ||
        0;
      return acc;
    }, {});

    // Fetch recent 10 tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    const monthlyData = await getEnhancedMonthlyTaskData({});

    res.status(200).json({
      statistic: {
        totalTasks,
        newTasks,
        inProgressTasks,
        completedTasks,
        pendingTasks,
        delayedTasks,
      },
      charts: {
        taskDistribution,
        taskPrioritiesLevels,
      },
      recentTasks,
      // monthlyData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const requestDueDateChange = async (req, res) => {
  try {
    const { pendingDueDate } = req.body;
    if (!pendingDueDate) {
      return res.status(400).json({ message: "Pending Due date is required" });
    }

    const date = new Date(pendingDueDate);
    if (isNaN(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (date < new Date()) {
      return res
        .status(400)
        .json({ message: "pendingDueDate must be in the future" });
    }

    // Finding the task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskId = task._id.toString();

    // Updating the task
    task.pendingDueDate = pendingDueDate;
    task.dueDateStatus = "pending";
    task.dueDateRequestedBy = req.user._id;
    await task.save();

    // Notify the superAdmin
    const superAdmins = await User.find({ role: "superAdmin" });
    const notifications = await Promise.all(
      superAdmins.map((sa) =>
        Notification.create({
          user: sa._id,
          message: `${req.user.name} shifted the deadline for "${
            task.title
          }" to ${date.toLocaleDateString()}.`,
          taskId: taskId,
          type: "info",
        })
      )
    );
    // Emit via socket
    const io = req.app.get("io");
    notifications.forEach((notification) => {
      io.to(notification.user.toString()).emit(
        "new-notification",
        notification
      );
    });

    return res.status(200).json({
      message: "Due date change request sent successfully",
      pendingDueDate: date,
      dueDateStatus: "pending",
    });
  } catch (error) {
    console.error("Error requesting due date change:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reviewDueDateChange = async (req, res) => {
  try {
    const { approve } = req.body;
    if (typeof approve !== "boolean") {
      return res
        .status(400)
        .json({ message: "approve must be a boolean in body" });
    }

    // Finding the task
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.dueDateStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "No pending due-date request to review" });
    }

    task.dueDateReviewedBy = req.user._id;
    task.dueDateReviewedAt = new Date();

    let notificationMsg;
    if (approve) {
      task.dueDateStatus = "approved";
      task.dueDate = task.pendingDueDate;
      notificationMsg = `${req.user.name} has approved task "${
        task.title
      }", due date to ${task.dueDate.toLocaleDateString()}`;
    } else {
      task.dueDateStatus = "rejected";
      notificationMsg = `${req.user.name} has rejected task "${
        task.title
      }", due date to ${task.dueDate.toLocaleDateString()}`;
    }

    task.pendingDueDate = undefined;

    // save the updated task
    await task.save();

    const taskId = task._id.toString();

    // notify the admin who requested it
    const requesterId = task.dueDateRequestedBy;
    const notif = await Notification.create({
      user: requesterId,
      message: notificationMsg,
      taskId: taskId,
      type: "info",
    });

    // emit in real time
    const io = req.app.get("io");
    io.to(requesterId.toString()).emit("new-notification", notif);

    return res.status(200).json({
      message: `Due-date request ${approve ? "approved" : "rejected"}`,
      dueDate: task.dueDate,
      dueDateStatus: task.dueDateStatus,
    });
  } catch (error) {
    console.error("reviewDueDateChange error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  getAdminTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
  requestDueDateChange,
  reviewDueDateChange,
};
