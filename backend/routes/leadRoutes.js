const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  createLead,
  updateLead,
  getLeads,
  getLead,
  deleteLead,
  getLeadDashboardData,
  decideDateChangeRequest,
} = require("../controllers/leadControllers");

const router = express.Router();

router.get(
  "/dashboard-data",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getLeadDashboardData
);

router.post(
  "/create-lead",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  createLead
);

router.get(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getLeads
);

router.get(
  "/:id",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getLead
);

router.put(
  "/:id",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  updateLead
);

router.delete(
  "/:id",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  deleteLead
);

router.patch(
  "/:id/date-change-request/:requestId",
  protect,
  allowRoleOrDept(["superAdmin"]),
  decideDateChangeRequest
);

module.exports = router;
