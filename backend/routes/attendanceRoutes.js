const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  exportAttendance,
  getTodayAttendance,
} = require("../controllers/attendanceControllers");

const router = express.Router();

router.post("/checkin", protect, checkIn);
router.post("/checkout", protect, checkOut);
router.get("/me", protect, getMyAttendance);
router.get("/today", protect, getTodayAttendance);
router.get(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["HR"]),
  getAllAttendance
);
router.put(
  "/:id",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["HR"]),
  updateAttendance
);
router.get(
  "/export",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["HR"]),
  exportAttendance
);

module.exports = router;
