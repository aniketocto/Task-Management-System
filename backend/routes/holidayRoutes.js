const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const { createHoliday, listHolidays, deleteHoliday } = require("../controllers/holidayController");

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["HR"]),
  createHoliday
);

router.get(
  "/",
  protect,
  listHolidays
);

router.delete(
  "/:id",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["HR"]),
  deleteHoliday
);

module.exports = router;
