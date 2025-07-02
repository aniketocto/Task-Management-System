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
        const pendingTask = await Task.countDocuments({
            assignedTo: user._id,
          status: "pending",
        });
      })
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc  Get user by id
// @route GET /api/users/:id
// @access Private

const getUser = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc  Delete a User
// @route DELETE /api/users/:id
// @access Private (Admin only)

const deleteUser = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  deleteUser,
};
