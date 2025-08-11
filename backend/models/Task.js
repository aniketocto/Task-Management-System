const mongoose = require("mongoose");

const completionLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);

const approvalLogSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["approved", "rejected"], required: true },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);

const todoSchema = new mongoose.Schema({
  text: { type: String },
  completed: { type: Boolean, default: false },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  approval: {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
  },
  completionLogs: [completionLogSchema], // User checks off completion
  approvalLogs: [approvalLogSchema], // Admin approves/rejects
});

const remarksSchema = new mongoose.Schema(
  {
    text: { type: String },
    date: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    _id: false,
  }
);

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
      enum: ["new", "working", "pending", "inProgress", "completed", "delayed"],
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
    reason: { type: String },
    // ---------------------------------------

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    clientApproval: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedAt: Date,
    },

    superAdminApproval: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedAt: Date,
    },

    // Additional Filled ---------------

    taskCategory: {
      type: String,
      enum: ["operational", "creative"],
      default: "operational",
    },
    objective: { type: String },
    creativeSizes: { type: String },
    targetAudience: { type: String },
    usps: { type: String },
    competetors: { type: String },
    channels: { type: String },
    smp: { type: String },
    referance: [{ type: String }],
    remarks: [remarksSchema],

    // ---------------------------
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
