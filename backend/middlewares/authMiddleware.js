const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed", error: error.message });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access Denied, Admin only" });
};

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === "superAdmin") {
    return next();
  }
  return res.status(403).json({ message: "Access Denied, Super Admin only" });
};

const allowRoleOrDept = (allowedRoles = [], allowedDepts = []) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (
      allowedRoles.includes(user.role) ||
      allowedDepts.includes(user.department)
    ) {
      return next();
    }

    return res.status(403).json({ message: "Access Denied" });
  };
};

module.exports = { protect, adminOnly, superAdminOnly, allowRoleOrDept };
