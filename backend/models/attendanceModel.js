const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    totalHours: {
      type: Number,
      default: 0, // computed in service layer
    },
    checkInStatus: {
      type: String,
      enum: ["present", "absent", "halfDay", "late"],
    },
    checkOutStatus: {
      type: String,
      enum: ["present", "early", "absent"],
    },
    workMode: {
      type: String,
      enum: ["office", "wfh", "onsite"],
      default: "office",
    },
    state: {
      type: String,
      enum: ["checkedInOnly", "checkedOutOnly", "completeEntry", "absent"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries: one record per user per date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
