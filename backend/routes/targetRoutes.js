const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  upsertQuaterTarget,
  getQuarterTarget,
} = require("../controllers/quarterTargetsController");
const router = express.Router();

router.post(
  "/quarter",
  protect,
  allowRoleOrDept(["superAdmin"], []),
  upsertQuaterTarget
);
router.get(
  "/quarter",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getQuarterTarget
);

module.exports = router;
