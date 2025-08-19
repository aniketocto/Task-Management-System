const mongoose = require("mongoose");

// Opening Schema
const openingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, trim: true },
    headcount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

const Opening = mongoose.model("Opening", openingSchema);

const interviewSchema = new mongoose.Schema(
  {
    opening:  { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    candidateName: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    rounds: { type: Number, required: true, min: 1 },
    interviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "rescheduled", "completed", "no_show", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

// enforce 1–2 interviewers
interviewSchema.path("interviewers").validate(function (arr) {
  return Array.isArray(arr) && arr.length >= 1 && arr.length <= 2;
}, "Must assign 1 or 2 interviewers");

const Interview = mongoose.model("Interview", interviewSchema);

const hrdocsSchema = new mongoose.Schema({
  recruitmentReport: { type: String },
  onBoarding: { type: String },
  offBoarding: { type: String },
  evalution: { type: String },
  appraisal: { type: String },
  hrPolicies: { type: String },
  hrProcess: { type: String },
  hrTraining: { type: String },
});

const HrDoc = mongoose.model("HrDoc", hrdocsSchema);

module.exports = { Opening, Interview, HrDoc };
