const express = require("express");
const {
  protect,
  allowRoleOrDept,
} = require("../middlewares/authMiddleware");
const {
  createLead,
  updateLead,
  getLeads,
  getLead,
} = require("../controllers/leadControllers");

const router = express.Router();

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

module.exports = router;
