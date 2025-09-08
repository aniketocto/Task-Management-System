const express = require("express");
const { protect, allowRoleOrDept } = require("../middlewares/authMiddleware");
const {
  getSOPs,
  createSOP,
  updateSop,
  deleteSop,
  getCompletedSOPs,
  getMySops,
  toggleSopCompletion,
} = require("../controllers/sopControllers");

const router = express.Router();

// --- Superadmin Routes for Managing SOPs --- //

router.get("/", protect, allowRoleOrDept(["superAdmin"]), getSOPs);

router.post("/", protect, allowRoleOrDept(["superAdmin"]), createSOP);

router.put("/:id", protect, allowRoleOrDept(["superAdmin"]), updateSop);

router.delete("/:id", protect, allowRoleOrDept(["superAdmin"]), deleteSop);

router.get(
  "/completion",
  protect,
  allowRoleOrDept(["superAdmin"]),
  getCompletedSOPs
);

// --- User Routes for Viewing and Completing SOPs --- //

router.get("/my", protect, getMySops);

router.post("/:id/toggle", protect, toggleSopCompletion);


module.exports = router;
