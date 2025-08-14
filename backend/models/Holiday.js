const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    date: { type: Date, required: true},
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });
module.exports = mongoose.model("Holiday", holidaySchema);
