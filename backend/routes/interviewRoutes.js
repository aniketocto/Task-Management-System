const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  createOpening,
  getAllOpenings,
  updateOpening,
  deleteOpening,
  createInterview,
  getAllInterviews,
  updateInterview,
  deleteInterview,
  getUpcomingInterviews,
  getDocs,
  addOrUpdateDocs,
  upsertBirthdayExpense,
  getDOB,
} = require("../controllers/interviewControllers");
const router = express.Router();

// Opening Management
router.post(
  "/create-opening",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  createOpening
);

router.get(
  "/get-all-openings",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  getAllOpenings
);

router.patch(
  "/update-opening/:id",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  updateOpening
);

router.delete(
  "/delete-opening/:id",
  protect,
  allowRoleOrDept(["superAdmin"], []),
  deleteOpening
);

// Interview Management
router.post(
  "/create",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  createInterview
);

router.get(
  "/get-all-interviews",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  getAllInterviews
);

router.get(
  "/get-upcoming-interviews",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  getUpcomingInterviews
);

router.put(
  "/update-interview/:id",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  updateInterview
);

router.delete(
  "/delete-interview/:id",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  deleteInterview
);

// Docs
router.post(
  "/add-docs",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  addOrUpdateDocs
);

router.get(
  "/get-docs",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  getDocs
);

// DOB
router.post(
  "/upsert-dob",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  upsertBirthdayExpense
);

router.get(
  "/get-dob",
  protect,
  allowRoleOrDept(["superAdmin"], ["HR"]),
  getDOB
);

module.exports = router;
