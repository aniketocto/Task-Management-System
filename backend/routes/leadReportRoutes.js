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
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getChannelRows
);

router.put(
  "/",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  updateChannelRow
);

// LeadReports docs API (legacy singleton)
router.post(
  "/docs",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  addOrUpdateDocs
);

router.get(
  "/docs",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getDocs
);

router.post(
  "/events",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  addEvent
);
router.get(
  "/events",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getEvents
);
router.delete(
  "/events/:id",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  deleteEvent
);
router.put(
  "/events/:id",
  protect,
   allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  updateEvent
);

module.exports = router;
