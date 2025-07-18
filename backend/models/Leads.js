const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    // ——— Basic lead info ———
    cName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // If you never want duplicates:
      unique: true,
    },
    jobProfile: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    // ——— Lifecycle enums ———
    status: {
      type: String,
      enum: [
        "followUp",
        "dead",
        "onboarded",
        "negotiation",
        "argument",
        "pitch",
      ],
      default: "followUp",
      required: true,
    },
    type: {
      type: String,
      enum: ["retainer", "project"],
      default: "retainer",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // ——— Key milestone dates ———
    leadCameDate: {
      type: Date,
    },
    credentialDeckDate: {
      type: Date,
    },
    discoveryCallDate: {
      type: Date,
    },
    pitchDate: {
      type: Date,
    },

    // ——— Attachments ———
    attachments: {
      briefUrl: { type: String, trim: true },
      presentationUrl: { type: String, trim: true },
      agreementUrl: { type: String, trim: true },
      invoiceUrl: { type: String, trim: true },
      websiteUrl: { type: String, trim: true },
    },

    remark: {
      type: String,
      trim: true,
    },

    // ——— Follow-up tick-boxes ———
    followUp: {
      attempt1: { type: Boolean, default: false },
      attempt2: { type: Boolean, default: false },
      attempt3: { type: Boolean, default: false },
      attempt4: { type: Boolean, default: false },
      attempt5: { type: Boolean, default: false },
    },

    // ——— Audit & relations ———
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    // automatically adds `createdAt` & `updatedAt`
    timestamps: true,
  }
);

module.exports = mongoose.model("Lead", leadSchema);
