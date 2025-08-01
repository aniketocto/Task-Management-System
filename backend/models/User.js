const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    role: { type: String, enum: ["superAdmin", "admin", "user"], default: "user" },
    department: {
      type: String,
      enum: [
        "Creative",
        "Digital",
        "Social",
        "DevelopmentUiUx",
        "Strategy",
        "BusinessDevelopment",
        "ClientServicing",
        "Management",
        "HR",
        "Other"
      ],
      default: "Other",
      
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
