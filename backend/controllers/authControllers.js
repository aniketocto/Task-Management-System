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

const registerUSer = async (req, res) => {};

// @desc Login user
// @route POST /api/auth/login
// @access Public

const loginUser = async (req, res) => {};

// @desc User profile
// @route GET /api/auth/profile
// @access Private (Requires jwt)

const getUserProfile = async (req, res) => {};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private (Requires jwt)

const updateUserProfile = async (req, res) => {};

module.exports = { registerUSer, loginUser, getUserProfile, updateUserProfile };
