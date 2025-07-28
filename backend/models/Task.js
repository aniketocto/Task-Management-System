const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  completed: { type: Boolean, default: false },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    companyName: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    status: {
      type: String,
      enum: ["new", "pending", "inProgress", "completed", "delayed"],
      default: "new",
    },
    dueDate: { type: Date, required: true },

    // --- New Approval Workflow Fields ---
    pendingDueDate: { type: Date },
    dueDateStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    dueDateRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dueDateReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dueDateReviewedAt: { type: Date },
    // ---------------------------------------

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
