const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  googleAuth,
  getDOB,
} = require("../controllers/authControllers");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Auth Routes;
router.post("/register", registerUser); //Reguster User
router.post("/login", loginUser); // Login User
router.post("/google", googleAuth);

router.get("/profile", protect, getUserProfile); // Get User Profile
router.put("/profile", protect, updateUserProfile); // Update User Profile

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  res.status(200).json({ imageUrl });
});

router.get("/dob", protect, getDOB);

module.exports = router;
