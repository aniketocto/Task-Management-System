const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getChannelRows,
  updateChannelRow,
  getDocs,
  addOrUpdateDocs,
  addEvent,
  getEvents,
  deleteEvent,
  updateEvent,
} = require("../controllers/leadReportController");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  getChannelRows
);

router.put(
  "/",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  updateChannelRow
);

// LeadReports docs API (legacy singleton)
router.post(
  "/docs",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  addOrUpdateDocs
);

router.get(
  "/docs",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  getDocs
);

router.post(
  "/events",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  addEvent
);
router.get(
  "/events",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  getEvents
);
router.delete(
  "/events/:id",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  deleteEvent
);
router.put(
  "/events/:id",
  protect,
  allowRoleOrDept(["superAdmin"], ["BusinessDevelopment"]),
  updateEvent
);

module.exports = router;
