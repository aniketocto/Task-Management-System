const mongoose = require("mongoose");

// ================== SOP Schema ==================
const sopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"], // keep lowercase for consistency
      required: true,
    },
    designation: { type: String, trim: true }, // role-based assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // user-specific assignment
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Indexes
sopSchema.index({ designation: 1 });
sopSchema.index({ assignedTo: 1 });

// Ensure SOP is assigned to either designation OR user (not both)
sopSchema.pre("validate", function (next) {
  if (this.designation && this.assignedTo) {
    return next(new Error("SOP cannot be assigned to both a designation and a specific user."));
  }
  if (!this.designation && !this.assignedTo) {
    return next(new Error("SOP must be assigned to either a designation or a specific user."));
  }
  next();
});

// ================== SOP Completion Schema ==================
const sopCompletionSchema = new mongoose.Schema(
  {
    sop: { type: mongoose.Schema.Types.ObjectId, ref: "SOP", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    completedAt: { type: Date, default: Date.now },
    completionKey: { type: String, required: true, unique: true }, 
  },
  { timestamps: true } 
);

// ================== Models ==================
const SOP = mongoose.model("SOP", sopSchema);
const SOPCompletion = mongoose.model("SOPCompletion", sopCompletionSchema);

module.exports = { SOP, SOPCompletion };
