const { mongoose } = require("mongoose");

const leadreportSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: "LeadReports_SINGLETON",
      unique: true,
      immutable: true,
    },

    coldCalling: mongoose.Schema.Types.Mixed,
    emailMarketing: mongoose.Schema.Types.Mixed,
    whatsappMarketing: mongoose.Schema.Types.Mixed,
    entireDb: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const LeadReports = mongoose.model("LeadReports", leadreportSchema);

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    industry: { type: String, required: true },
    pass: { type: String, required: true },
    expense: { type: String, required: true },
    leadReport: { type: String, required: true },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

const activityChannelSchema = new mongoose.Schema(
  {
    leadSource: {
      type: String,
      enum: [
        "coldCalling",
        "linkedInOutreach",
        "events",
        "referral",
        "whatsAppMarketing",
        "emailMarketing",
        "metaAds",
        "googleAds",
        "socialMedia",
        "website",
        "justDial",
        "indiaMart",
        "fiverr",
      ],
      required: true,
    },
    month: { type: String, required: true }, // "2025-08" (YYYY-MM)
    activitiesPlanned: { type: String, default: "" },
    frequency: { type: String, default: "" },
    owner: { type: String, default: "" },
    targetLeads: { type: Number, default: 0 },
    actualLeads: { type: Number, default: 0 },
    budgetAllocation: { type: Number, default: 0 },
    expectedConversions: { type: Number, default: 0 },
    actualConversions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

activityChannelSchema.index({ leadSource: 1, month: 1 }, { unique: true });

const ActivityChannel = mongoose.model(
  "ActivityChannel",
  activityChannelSchema
);

module.exports = { LeadReports, Event, ActivityChannel };
