const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getCompany,
  createCompany,
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


module.exports = router;