const User = require("../models/User");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc Registe a new user
// @route POST /api/auth/register
// @access Public

const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImageUrl, department, adminInviteToken } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Determine user role: Admin if correct token is provides, otherwise user
    let role = "user";
    if (
      adminInviteToken &&
      adminInviteToken === process.env.ADMIN_INVITE_TOKEN
    ) {
      role = "admin";
    }

    // Hash password
    const salt = await bycrypt.genSalt(10);
    const hashedPassword = await bycrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
      role,
      department
    });

    // Return user data with jwt
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });


  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public

const loginUser = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc User profile
// @route GET /api/auth/profile
// @access Private (Requires jwt)

const getUserProfile = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private (Requires jwt)

const updateUserProfile = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
