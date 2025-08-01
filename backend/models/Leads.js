const mongoose = require("mongoose");

const dateChangeRequestSchema = new mongoose.Schema({
  field: {
    type: String,
    enum: [
      "leadCameDate",
      "credentialDeckDate",
      "discoveryCallDate",
      "pitchDate",
    ],
    required: true,
  },
  oldDate: { type: Date, required: true },
  newDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requestedAt: { type: Date, default: Date.now },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  decidedAt: { type: Date },
  reason: { type: String },
});

const leadSchema = new mongoose.Schema(
  {
    // ——— Basic COP lead info ———
    cName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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
    contact: {
      type: String,
      // required: true,
      trim: true,
    },
    socials: {
      instagramUrl: { type: String, trim: true },
      linkedinUrl: { type: String, trim: true },
    },
    leadSource: {
      type: String,
      enum: [
        "website",
        "inboundWhatsApp",
        "whatsAppReTarget",
        "inboundEmail",
        "outboundEmail",
        "metaAds",
        "googleAds",
        "events",
        "referral",
        "others",
      ],
      default: "others",
      required: true,
      trim: true,
    },
    referral: {
      name: { type: String, trim: true },
    },
    // ——— Basic COP lead info ———

    // ——— Lead details ———
    status: {
      type: String,
      enum: [
        "new",
        "followUp",
        "dead",
        "onboarded",
        "negotiation",
        "argument",
        "pitch",
      ],
      default: "new",
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
      enum: [
        "realEstate",
        "hospitality",
        "bsfi",
        "fmcg",
        "healthcare",
        "wellness",
        "fnb",
        "agency",
        "fashion",
        "other",
      ],
      default: "other",
      required: true,
      trim: true,
    },
    services: {
      type: String,
      enum: [
        "logoDesign",
        "socialMediaManagement",
        "leadGeneration",
        "webDesignNDev",
        "appDesignNDev",
        "videoProduction",
        "branding",
        "visualIdentity",
        "coffeeTableBook",
        "brochures",
        "merchandise",
        "stallDesign",
        "influencerMarketing",
        "siteBranding",
        "packaging",
        "energy",
        "others",
      ],
      default: "others",
      required: true,
      trim: true,
    },
    brief: {
      type: String,
      trim: true,
      required: true,
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
    dateChangeRequests: [dateChangeRequestSchema],

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
