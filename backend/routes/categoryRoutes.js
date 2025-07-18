const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getCategories,
  createCategory,
} = require("../controllers/categoryController");
const router = express.Router();

router.get(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  getCategories
);
router.post(
  "/",
  protect,
  allowRoleOrDept(["admin", "superAdmin"], ["BusinessDevelopment"]),
  createCategory
);

module.exports = router;
