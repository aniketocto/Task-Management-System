const Task = require("../models/Task");

const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    let tasks;
    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({ assignedTo: req.user._id, ...filter }).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    }

    // Add completed todoChecklist count to each task
    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedTodoCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;
        return {
          ...task._doc,
          completedTodoCount: completedTodoCount,
        };
      })
    );

    // Status Summary Count
    const allTasks = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user._id }
    );

    const newTasks = await Task.countDocuments({
      ...filter,
      status: "new",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "pending",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "inProgress",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "completed",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    res.status(200).json({
      tasks,
      statusSummary: {
        all: allTasks,
        newTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskChecklist = async (req, res) => {
  try {
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
};
