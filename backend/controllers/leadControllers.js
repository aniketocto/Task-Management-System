const Notification = require("../models/Notification");
const Leads = require("../models/Leads");
const moment = require("moment");
const User = require("../models/User");

const createLead = async (req, res) => {
  try {
    const {
      cName,
      email,
      jobProfile,
      companyName,
      contact,
      social,
      leadSource,
      referral,
      status,
      type,
      category,
      services,
      brief,
      leadCameDate,
      credentialDeckDate,
      discoveryCallDate,
      pitchDate,
      attachments,
      remark,
      followUp,
    } = req.body;

    const normalizedServices = Array.isArray(services)
      ? [...new Set(services)]
      : services
      ? [services]
      : [];

    let safeFollowUp = {};
    if (followUp) {
      for (let i = 1; i <= 5; i++) {
        const key = `attempt${i}`;
        const val = followUp[key];
        if (typeof val === "object" && val !== null) {
          safeFollowUp[key] = {
            done: !!val.done,
            remark: val.remark || "",
          };
        } else if (typeof val === "boolean") {
          safeFollowUp[key] = {
            done: val,
            remark: "",
          };
        } else {
          safeFollowUp[key] = { done: false, remark: "" };
        }
      }
    }

    const lead = await Leads.create({
      cName,
      email,
      jobProfile,
      companyName,
      contact,
      social,
      leadSource,
      referral,
      status,
      type,
      category,
      services: normalizedServices,
      brief,
      leadCameDate,
      credentialDeckDate,
      discoveryCallDate,
      pitchDate,
      attachments,
      remark,
      followUp: safeFollowUp,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Lead created successfully", lead });
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLeads = async (req, res) => {
  try {
    const { status, type, category, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;

    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));
    const skipVal = (pageNum - 1) * pageSize;

    const leads = await Leads.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipVal)
      .limit(pageSize)
      .lean();

    const total = await Leads.countDocuments(filter);

    return res.json({
      leads,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error getting leads:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getLead = async (req, res) => {
  try {
    const lead = await Leads.findById(req.params.id).lean();

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    return res.json(lead);
  } catch (error) {
    console.error("Error getting lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = await Leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    await lead.deleteOne();
    return res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLeadDashboardData = async (req, res) => {
  try {
    // Fetch Statistic
    const totalLeads = await Leads.countDocuments();
    const newLeads = await Leads.countDocuments({ status: "new" });
    const followUpLeads = await Leads.countDocuments({ status: "followUp" });
    const deadLeads = await Leads.countDocuments({ status: "dead" });
    const onboardedLeads = await Leads.countDocuments({ status: "onboarded" });
    const legalLeads = await Leads.countDocuments({ status: "legal" });
    const agreementLeads = await Leads.countDocuments({ status: "agreement" });
    const pitchLeads = await Leads.countDocuments({ status: "pitch" });
    const negotiationLeads = await Leads.countDocuments({
      status: "negotiation",
    });

    const leadStatuses = [
      "new",
      "followUp",
      "dead",
      "onboarded",
      "legal",
      "agreement",
      "pitch",
      "negotiation",
    ];

    const leadDistributionRaw = await Leads.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const leadDistribution = leadStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        leadDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});

    const leadCategories = [
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
    ];

    const categoryDistributionRaw = await Leads.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryDistribution = leadCategories.reduce((acc, cat) => {
      acc[cat] =
        categoryDistributionRaw.find((item) => item._id === cat)?.count || 0;
      return acc;
    }, {});

    res.json({
      statistic: {
        totalLeads,
        newLeads,
        followUpLeads,
        deadLeads,
        onboardedLeads,
        legalLeads,
        agreementLeads,
        pitchLeads,
        negotiationLeads,
      },
      charts: {
        leadDistribution,
        categoryDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { role, _id: userId, name } = req.user;
    const lead = await Leads.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const dateFields = ["credentialDeckDate", "discoveryCallDate", "pitchDate"];
    let updateFields = {};
    let requestsMade = [];
    const globalReason = req.body.changeReason;

    for (let field of dateFields) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        const newDate = new Date(req.body[field]);
        const prevDate = lead[field];

        if (role === "admin") {
          // Correct date check!
          if (prevDate && moment().isAfter(moment(prevDate), "day")) {
            lead.dateChangeRequests = lead.dateChangeRequests || [];
            lead.dateChangeRequests.push({
              field,
              oldDate: prevDate,
              newDate, // <--- You missed this! Store the new date being requested
              status: "pending",
              requestedBy: userId,
              requestedAt: new Date(),
              reason: globalReason,
            });

            requestsMade.push(field);
          } else {
            updateFields[field] = newDate;
          }
        } else if (role === "superAdmin") {
          // superadmin can always update directly
          updateFields[field] = newDate;
        }
      }
    }

    // Regular allowed fields
    const allowedFields = [
      "cName",
      "jobProfile",
      "companyName",
      "email",
      "contact",
      "socials",
      "leadSource",
      "referral",
      "status",
      "type",
      "category",
      "services",
      "brief",
      "attachments",
      "remark",
    ];
    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }
    if (req.body.followUp) {
      // Ensure each attempt is always an object {done, remark}
      const newFollowUp = {};
      for (let i = 1; i <= 5; i++) {
        const key = `attempt${i}`;
        const val = req.body.followUp[key];
        if (typeof val === "object" && val !== null) {
          // Already in desired shape
          newFollowUp[key] = {
            done: !!val.done,
            remark: val.remark || "",
          };
        } else if (typeof val === "boolean") {
          // Legacy or quick toggle: just a boolean
          newFollowUp[key] = {
            done: val,
            remark: "",
          };
        } else {
          // Not provided, fallback (preserves previous value)
          newFollowUp[key] =
            lead.followUp && lead.followUp[key]
              ? lead.followUp[key]
              : { done: false, remark: "" };
        }
      }
      updateFields.followUp = newFollowUp;
    }

    if (req.body.services !== undefined) {
      const raw = req.body.services;
      updateFields.services = Array.isArray(raw)
        ? [...new Set(raw)]
        : raw
        ? [raw]
        : [];
    }

    Object.assign(lead, updateFields);
    await lead.save();

    if (requestsMade.length) {
      return res.json({
        message: `Update requested for ${requestsMade.join(
          ", "
        )}. Awaiting superadmin approval.`,
        lead,
      });
    } else {
      return res.json({ message: "Lead updated successfully", lead });
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const decideDateChangeRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { decision } = req.body;

    const lead = await Leads.findById(id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const request = lead.dateChangeRequests.id(requestId);
    if (!request || request.status !== "pending")
      return res.status(404).json({ message: "No pending request found" });

    if (decision === "approved") {
      lead[request.field] = request.newDate;
      request.status = "approved";
    } else {
      request.status = "rejected";
    }
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();

    await lead.save();

    return res.json({ message: "Decision updated", lead });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUpcomingMeetings = async (req, res) => {
  try {
    const today = new Date();
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);

    const { companyName } = req.query;
    const matchCompany = companyName ? { companyName } : {};

    const leads = await Leads.find({
      ...matchCompany,
      $or: [
        {
          credentialDeckDate: {
            $gte: today,
            $lt: next7,
          },
        },
        {
          discoveryCallDate: {
            $gte: today,
            $lt: next7,
          },
        },
        {
          pitchDate: {
            $gte: today,
            $lt: next7,
          },
        },
      ],
    })
      .select(
        "companyName credentialDeckDate discoveryCallDate pitchDate status services category"
      )
      .lean();

    const meetings = [];
    leads.forEach((lead) => {
      if (
        lead.credentialDeckDate &&
        new Date(lead.credentialDeckDate) >= today &&
        new Date(lead.credentialDeckDate) <= next7
      ) {
        meetings.push({
          type: "Credential Deck",
          date: lead.credentialDeckDate,
          companyName: lead.companyName,
          cName: lead.cName,
          status: lead.status,
          services: lead.services,
          category: lead.category,
        });
      }
      if (
        lead.discoveryCallDate &&
        new Date(lead.discoveryCallDate) >= today &&
        new Date(lead.discoveryCallDate) <= next7
      ) {
        meetings.push({
          type: "Discovery Call",
          date: lead.discoveryCallDate,
          companyName: lead.companyName,
          cName: lead.cName,
          status: lead.status,
          services: lead.services,
          category: lead.category,
        });
      }
      if (
        lead.pitchDate &&
        new Date(lead.pitchDate) >= today &&
        new Date(lead.pitchDate) <= next7
      ) {
        meetings.push({
          type: "Pitch",
          date: lead.pitchDate,
          companyName: lead.companyName,
          cName: lead.cName,
          status: lead.status,
          services: lead.services,
          category: lead.category,
        });
      }
    });
    meetings.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createLead,
  updateLead,
  getLeads,
  getLead,
  deleteLead,
  getLeadDashboardData,
  decideDateChangeRequest,
  getUpcomingMeetings,
};
