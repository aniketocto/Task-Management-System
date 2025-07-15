const User = require("../models/User");
const Task = require("../models/Task");

// @desc  Get all user (Admin only)
// @route GET /api/users/
// @access Private (Admin)

const getUsers = async (req, res) => {
  try {
    const { month } = req.query;
    let dateFilter = {};
    if (month) {
      const [year, monthNum] = month.split("-")
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }
    const users = await User.find({ role: { $in: ["user", "admin"] } }).select(
      "-password"
    );

    // Add tasks count to each user
    const usersWithTaskCount = await Promise.all(
      users.map(async (user) => {
        const baseQuery = { assignedTo: user._id, ...dateFilter };
        const [
          newTask,
          pendingTask,
          inProgressTask,
          completedTask,
          delayedTask,
          totalTask,
        ] = await Promise.all([
          Task.countDocuments({ ...baseQuery, status: "new" }),
          Task.countDocuments({ ...baseQuery, status: "pending" }),
          Task.countDocuments({ ...baseQuery, status: "inProgress" }),
          Task.countDocuments({ ...baseQuery, status: "completed" }),
          Task.countDocuments({ ...baseQuery, status: "delayed" }),
          Task.countDocuments({ ...baseQuery }), // 👈 total without status filter
        ]);

        return {
          ...user._doc,
          newTask,
          pendingTask,
          inProgressTask,
          completedTask,
          delayedTask,
          totalTask,
        };
      })
    );

    res.json(usersWithTaskCount);
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

module.exports = {
  getUsers,
  getUser,
  deleteUser,
};

