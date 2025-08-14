const mongoose = require("mongoose");

const MonthTargetSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    target: { type: Number, required: true },
  },
  { _id: false }
);

const QuarterTargetSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    quarter: {
      type: String,
      enum: ["JFM", "AMJ", "JAS", "OND"],
      required: true,
    },
    carryForward: { type: Boolean, default: true },
    months: {
      type: [MonthTargetSchema],
      validate: [
        (arr) => arr.length === 3,
        "Exactly 3 months required for a quarter",
      ],
    },
  },
  { timestamps: true }
);

QuarterTargetSchema.index({ year: 1, quarter: 1 }, { unique: true });
module.exports = mongoose.model("QuarterTarget", QuarterTargetSchema);
