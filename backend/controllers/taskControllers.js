const Task = require("../models/Task");

const getTasks = async (req, res) => {
  try {
    const { department, status, month, page = 1, limit = 12 } = req.query;

    const skip = (page - 1) * limit;

    let filter = {};

    if (status) filter.status = status;

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

      filter.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const isPrivileged = ["admin", "superAdmin"].includes(req.user.role);

    // Base filter for user access control
    let baseFilter = {};
    if (!isPrivileged) {
      baseFilter.assignedTo = { $in: [req.user._id] };
    }

    // Department filter
    if (department) {
      const usersInDept = await User.find({ department }).select("_id");
      const userIds = usersInDept.map((u) => u._id);

      if (!isPrivileged) {
        // For non-privileged users, check if they belong to the requested department
        if (userIds.some((id) => id.toString() === req.user._id.toString())) {
          filter.assignedTo = { $in: [req.user._id] };
        } else {
          // User doesn't belong to requested department, return empty results
          return res.status(200).json({
            tasks: [],
            totalCount: 0,
            statusSummary: {
              all: 0,
              newTasks: 0,
              pendingTasks: 0,
              inProgressTasks: 0,
              completedTasks: 0,
              delayedTasks: 0,
            },
            monthlyData: { monthsData: [], allTimeTotal: 0 },
            departmentBreakdown: {},
            userBreakdown: {},
          });
        }
      } else {
        filter.assignedTo = { $in: userIds };
      }
    } else {
      // Apply base filter when no department specified
      filter = { ...filter, ...baseFilter };
    }

    // Fetch paginated tasks
    let tasks = await Task.find(filter)
      .populate("assignedTo", "name email profileImageUrl department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach completed todo count
    tasks = await Promise.all(
      tasks.map((task) => {
        const completedTodoCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;

        return {
          ...task._doc,
          completedTodoCount,
        };
      })
    );

    // Total count for pagination
    const totalCount = await Task.countDocuments(filter);

    // Status summary
    const countWith = (status) => Task.countDocuments({ ...filter, status });

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

    // Get enhanced monthly data with department and user breakdown
    const monthlyData = await getEnhancedMonthlyTaskData(
      isPrivileged ? {} : { assignedTo: { $in: [req.user._id] } },
      department
    );

    res.status(200).json({
      tasks,
      totalCount,
      statusSummary: {
        all: allTasks,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        delayedTasks,
      },
      monthlyData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enhanced helper function to get monthly task data with department and user breakdown
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

    const monthFilter = {
      ...baseFilter,
      createdAt: {
        $gte: monthDate,
        $lt: nextMonthDate,
      },
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

// Helper function to get department breakdown
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

// Helper function to get user breakdown
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

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      attachments,
      todoChecklist,
    } = req.body;

    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "Assigned to must be an array of user IDs" });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      attachments,
      todoChecklist,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
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

    // --- User can only update todoChecklist ---
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

    // --- Admin can update all except dueDate ---
    if (role === "admin") {
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.priority = req.body.priority || task.priority;
      task.attachments = req.body.attachments || task.attachments;

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

    // --- SuperAdmin can update everything ---
    if (role === "superAdmin") {
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
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

    const updatedTask = await task.save();
    res
      .status(200)
      .json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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

    if (
      !task.assignedTo.includes(req.user._id) &&
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
    // Fetch statistics
    const totalTasks = await Task.countDocuments();
    const newTasks = await Task.countDocuments({ status: "new" });
    const inProgressTasks = await Task.countDocuments({ status: "inProgress" });
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const delayedTasks = await Task.countDocuments({ status: "delayed" });

    // Ensure all task status
    const taskStatuses = [
      "new",
      "pending",
      "inProgress",
      "completed",
      "delayed",
    ];

    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
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
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPrioritiesLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPrioritiesLevelsRaw.find((item) => item._id === priority)?.count ||
        0;
      return acc;
    }, {});

    // Fetch recent 10 tasks
    const recentTasks = await Task.find()
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
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
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
      { $match: { assignedTo: userId } },
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
      { $match: { assignedTo: userId } },
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
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
