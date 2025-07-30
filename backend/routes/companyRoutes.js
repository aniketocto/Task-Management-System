const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getCompany,
  createCompany,
  deleteCompany,
} = require("../controllers/companyController");
const router = express.Router();

router.get(
  "/",
  protect,
  getCompany
);

router.post(
  "/",
  protect,
  createCompany
);
router.delete(
  "/",
  protect,
  allowRoleOrDept(["superAdmin", "admin"], ["BusinessDevelopment"]),
  deleteCompany
);

module.exports = router;