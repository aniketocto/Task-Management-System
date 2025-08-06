const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      profileImageUrl,
      department,
      adminInviteToken,
    } = req.body;

    // Check if user already existsx`
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Determine role
    let role = "user";

    if (
      adminInviteToken &&
      adminInviteToken === process.env.SUPER_ADMIN_INVITE_TOKEN
    ) {
      role = "superAdmin";
    } else if (
      adminInviteToken &&
      adminInviteToken === process.env.ADMIN_INVITE_TOKEN
    ) {
      role = "admin";
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
      role,
      department,
    });

    // Return user data + JWT
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Paswword" });
    }

    // Return user data with jwt
    res.status(200).json({
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

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.department = req.body.department || user.department;
    user.profileImageUrl = req.body.profileImageUrl || user.profileImageUrl;
    user.designation = req.body.designation || user.designation;

    // Handle password update (only if sent)
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      profileImageUrl: updatedUser.profileImageUrl,
      designation: updatedUser.designation,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { idToken, adminInviteToken, department, profileImage, designation } =
      req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email_verified, email, name, picture } = ticket.getPayload();

    if (!email_verified) {
      return res.status(401).json({ message: "Email not verified by Google" });
    }

    let role = "user";
    if (adminInviteToken === process.env.SUPER_ADMIN_INVITE_TOKEN) {
      role = "superAdmin";
    } else if (adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
      role = "admin";
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = bcrypt.hashSync(
        Math.random().toString(36).slice(-8),
        10
      );

      // Use uploaded profileImage (base64), otherwise fallback to Google profile pic
      const profileImageUrl = profileImage || picture;

      user = await User.create({
        name,
        email,
        password: randomPassword,
        profileImageUrl, // base64 or Google image URL
        role,
        department,
        designation
      });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      department: user.department,
      designation: user.designation,
      token,
    });
  } catch (error) {
    console.error("❌ googleAuth error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  googleAuth,
};
