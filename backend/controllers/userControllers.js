const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");

// @desc  Get all user (Admin only)
// @route GET /api/users/
// @access Private (Admin)

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    
    // Add tasks count to each user
    const usersWithTaskCount = await Promise.all(
      users.map(async (user) => {
        const newTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "new",
        });
        const pendingTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "pending",
        });
        const inProgressTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "inProgress",
        });
        const completedTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "completed",
        });
        return {
          ...user._doc,
          newTask,
          pendingTask,
          inProgressTask,
          completedTask,
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
