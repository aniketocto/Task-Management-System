const mongoose = require("mongoose");

const birthdayExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    amount: { type: Number, default: 0 },      
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  },
  { timestamps: true }
);

birthdayExpenseSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("BirthdayExpense", birthdayExpenseSchema);
