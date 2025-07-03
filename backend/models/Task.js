const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  completed: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
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
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
