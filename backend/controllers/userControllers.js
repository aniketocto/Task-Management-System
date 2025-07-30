const User = require("../models/User");
const Task = require("../models/Task");

// @desc  Get all user (Admin only)
// @route GET /api/users/
// @access Private (Admin)

// userControllers.js

const getUsers = async (req, res) => {
  try {
    const { month } = req.query;
    let dateFilter = {};
    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    const users = await User.find({ role: { $in: ["user", "admin"] } })
      .select("-password")
      .lean();

    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        // 1️⃣ Main‐task counts by status
        const mainBase = { assignedTo: u._id, ...dateFilter };
        const [
          newTask,
          pendingTask,
          inProgressTask,
          completedTask,
          delayedTask,
          totalTask,
        ] = await Promise.all([
          Task.countDocuments({ ...mainBase, status: "new" }),
          Task.countDocuments({ ...mainBase, status: "pending" }),
          Task.countDocuments({ ...mainBase, status: "inProgress" }),
          Task.countDocuments({ ...mainBase, status: "completed" }),
          Task.countDocuments({ ...mainBase, status: "delayed" }),
          Task.countDocuments(mainBase),
        ]);

        // 2️⃣ Sub‐task counts by parent‐task status
        //    (one entry per checklist item)
        const subAgg = await Task.aggregate([
          { $match: dateFilter },
          { $unwind: "$todoChecklist" },
          { $match: { "todoChecklist.assignedTo": u._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]);

        // initialize all to zero
        let subNew = 0,
          subPending = 0,
          subInProgress = 0,
          subCompleted = 0,
          subDelayed = 0;
        for (const { _id, count } of subAgg) {
          switch (_id) {
            case "new":
              subNew = count;
              break;
            case "pending":
              subPending = count;
              break;
            case "inProgress":
              subInProgress = count;
              break;
            case "completed":
              subCompleted = count;
              break;
            case "delayed":
              subDelayed = count;
              break;
          }
        }
        const subTotal =
          subNew + subPending + subInProgress + subCompleted + subDelayed;

        return {
          ...u,
          // main task counts
          newTask,
          pendingTask,
          inProgressTask,
          completedTask,
          delayedTask,
          totalTask,
          // sub‐task counts
          subNew,
          subPending,
          subInProgress,
          subCompleted,
          subDelayed,
          subTotal,
        };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc  Get user by id
// @route GET /api/users/:id
// @access Private

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc  Delete a User
// @route DELETE /api/users/:id
// @access Private (Admin only)

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDepartment = async (req, res) => {
  try {
    const departments = await User.distinct("department");
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  deleteUser,
  getDepartment,
};
