const Notification = require("../models/Notification");
const Leads = require("../models/Leads");
const moment = require("moment");
const User = require("../models/User");
const QuarterTarget = require("../models/QuarterTarget");

const BYPASS_DATE_APPROVAL = process.env.BYPASS_DATE_APPROVAL === "true";

const parseLocalDateTime = (input) => {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) return input;
  const str = String(input).trim();
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(str);
  if (onlyDate) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const noTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str);
  if (noTZ) {
    const [datePart, timePart] = str.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }
  const dt = new Date(str);
  if (isNaN(dt)) throw new Error(`Invalid date input: ${str}`);
  return dt;
};

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
      amount,
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
      leadCameDate: parseLocalDateTime(leadCameDate), // keep exact local time
      credentialDeckDate: parseLocalDateTime(credentialDeckDate),
      discoveryCallDate: parseLocalDateTime(discoveryCallDate),
      pitchDate: parseLocalDateTime(pitchDate),
      attachments,
      remark,
      followUp: safeFollowUp,
      createdBy: req.user._id,
      amount,
    });

    res.status(201).json({ message: "Lead created successfully", lead });
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLeads = async (req, res) => {
  try {
    const { status, type, category, month, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      filter.createdAt = {
        $gte: new Date(year, monthNum - 1, 1),
        $lt: new Date(year, monthNum, 1),
      };
    }

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
      "bfsi",
      "fmcg",
      "healthcare",
      "wellness",
      "fnb",
      "agency",
      "energy",
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
    const { role, _id: userId } = req.user;
    const lead = await Leads.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const dateFields = ["credentialDeckDate", "discoveryCallDate", "pitchDate"];
    let updateFields = {};
    let requestsMade = [];
    const globalReason = req.body.changeReason;

    for (const field of dateFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      const incoming = req.body[field];

      // 🔓 TEMP BYPASS: let anyone set/clear date/time directly
      if (BYPASS_DATE_APPROVAL) {
        updateFields[field] =
          incoming === "" || incoming === null
            ? null
            : parseLocalDateTime(incoming);
        continue; // skip approval logic entirely
      }

      // --- existing logic below stays as-is ---
      const newDate =
        incoming === "" || incoming === null
          ? null
          : parseLocalDateTime(incoming);
      const prevDate = lead[field];

      if (role === "admin") {
        if (prevDate && moment(prevDate).isBefore(moment().startOf("day"))) {
          lead.dateChangeRequests = lead.dateChangeRequests || [];
          lead.dateChangeRequests.push({
            field,
            oldDate: prevDate,
            newDate,
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
        updateFields[field] = newDate;
      }
    }

    const incomingStatus = req.body.status ?? lead.status;
    const wasOnBoarded = lead.status === "onboarded";
    const willBeOnBoarded = incomingStatus === "onboarded";

    if (!wasOnBoarded && willBeOnBoarded) {
      const incomingAmount = Number(req.body.amount);
      if (!(incomingAmount > 0)) {
        return res.status(400).json({
          message: "Amount is required and must be > 0 when onboarding a lead.",
        });
      }

      if (!lead.onboardedAt) {
        lead.onboardedAt = new Date();
        lead.amount = incomingAmount;
      }
    }

    // if (
    //   wasOnBoarded &&
    //   req.body.amount !== undefined &&
    //   role !== "superAdmin"
    // ) {
    //   return res.status(403).json({
    //     message: "Only superAdmin can modify amount after onboarding.",
    //   });
    // }

    if (!willBeOnBoarded && req.body.amount !== undefined) {
      return res.status(400).json({
        message: "Amount can only be set when status is 'onboarded'.",
      });
    }

    if (req.body.status !== undefined && req.body.status !== lead.status) {
      lead.statusHistory = lead.statusHistory || [];
      lead.statusHistory.push({
        status: req.body.status,
        changedAt: new Date(),
        changedBy: userId,
      });
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
      "amount",
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

    const io = req.app.get("io");
    if (io)
      io.emit("lead:sync", {
        source: "targets" | "leads",
      });

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

const getMeetingCount = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const pipeline = [
      {
        $match: {
          $or: [
            {
              credentialDeckDate: {
                $gte: monthStart,
                $lt: monthEnd,
              },
            },
            {
              discoveryCallDate: {
                $gte: monthStart,
                $lt: monthEnd,
              },
            },
            {
              pitchDate: {
                $gte: monthStart,
                $lt: monthEnd,
              },
            },
          ],
        },
      },
      {
        $project: {
          meetings: ["$credentialDeckDate", "$discoveryCallDate", "$pitchDate"],
        },
      },
      {
        $project: {
          meeting: {
            $filter: {
              input: "$meetings",
              as: "dt",
              cond: {
                $and: [
                  { $ne: ["$$dt", null] },
                  { $gte: ["$$dt", monthStart] },
                  { $lt: ["$$dt", monthEnd] },
                ],
              },
            },
          },
        },
      },
      { $unwind: "$meeting" },
      {
        $addFields: {
          weekIndex: {
            $floor: {
              $divide: [
                { $subtract: ["$meeting", monthStart] },
                1000 * 60 * 60 * 24 * 7,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$weekIndex",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          weekly: {
            $push: {
              week: { $add: ["$_id", 1] },
              count: "$count",
            },
          },
          totalMeetings: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          totalMeetings: 1,
          weekly: 1,
        },
      },
    ];

    const result = await Leads.aggregate(pipeline);
    const data = result[0] || { totalMeetings: 0, weekly: [] };

    const monthlyTarget = 60;
    const weeklyTarget = monthlyTarget / 4;

    res.json({
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalMeetings: data.totalMeetings,
      monthlyTarget,
      remainingToMonthlyTarget: Math.max(0, monthlyTarget - data.totalMeetings),
      weekly: data.weekly.sort((a, b) => a.week - b.week),
      weeklyTarget,
    });
  } catch (error) {
    console.error("Error in getMonthlyMeetingCounts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const QUARTER_MONTHS = {
  JFM: [1, 2, 3],
  AMJ: [4, 5, 6],
  JAS: [7, 8, 9],
  OND: [10, 11, 12],
};

const monthStart = (y, m) => new Date(y, m, -1, 1);
const addMonths = (y, m, delta) => {
  const d = new Date(y, m, -1, 1);
  d.setMonth(d.getMonth() + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const getQuarterProgress = async (req, res) => {
  try {
    //  validate inputs
    const year = Number(req.query.year);
    const quarter = String(req.query.quarter || "").toUpperCase();
    if (!year || !QUARTER_MONTHS[quarter]) {
      return res
        .status(400)
        .json({ message: "Provide ?year=YYYY and ?quarter=JFM|AMJ|JAS|OND" });
    }

    //  resolve the three months for this quarter (same year)
    const monthsNums = QUARTER_MONTHS[quarter];
    const months = monthsNums.map((m) => ({ year, month: m }));

    // compute overall time window
    const qStart = monthStart(year, months[0].month); // start of first month
    const after = addMonths(year, months[2].month, 1); // month after the last month
    const qEnd = monthStart(after.year, after.month); // exclusive upper bound

    //  aggregate ACTUALS from Leads for this quarter window, grouped by YYYY-MM in IST
    const actualsAgg = await Leads.aggregate([
      {
        $match: {
          status: "onboarded", // only onboarded are counted
          onboardedAt: { $gte: qStart, $lt: qEnd }, // falls inside the quarter window
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$onboardedAt",
              timezone: "Asia/Kolkata",
            },
          },
          total: { $sum: "$amount" }, // sum money for the month
        },
      },
    ]);

    // index actuals by "YYYY-MM" for fast lookup
    const actualsMap = {};
    for (const row of actualsAgg) actualsMap[row._id] = row.total || 0;

    //  load PLANNED targets
    const qt = await QuarterTarget.findOne({ year, quarter }).lean();
    const carryForward = qt ? !!qt.carryForward : true;
    const targetMap = {};
    if (qt?.months?.length === 3) {
      qt.months.forEach((m) => {
        const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
        targetMap[key] = Number(m.target) || 0;
      });
    } else {
      months.forEach(({ year: y, month: m }) => {
        // stub zeros
        const key = `${y}-${String(m).padStart(2, "0")}`;
        targetMap[key] = 0;
      });
    }

    // build month rows in order, compute carry-forward
    let carryIn = 0;
    const now = new Date();
    const rows = months.map(({ year: y, month: m }, index) => {
      const monthStartDate = new Date(y, m - 1, 1);
      const isFutureMonth = monthStartDate > now;

      const key = `${y}-${String(m).padStart(2, "0")}`;
      const plannedTarget = targetMap[key] || 0;
      const actual = actualsMap[key] || 0;

      const monthCarryIn = isFutureMonth
        ? 0
        : carryForward
        ? index === 0
          ? 0
          : carryIn
        : 0;
      const effectiveTarget = plannedTarget + monthCarryIn;
      const variance = actual - effectiveTarget;
      const shortfall = Math.max(effectiveTarget - actual, 0);
      if (!isFutureMonth) {
        carryIn = shortfall;
      } else {
        carryIn = 0;
      }

      return {
        year: y,
        month: m,
        plannedTarget,
        carryIn: monthCarryIn,
        effectiveTarget,
        actual,
        variance,
      };
    });

    // totals
    const totals = rows.reduce(
      (t, r) => ({
        plannedTarget: t.plannedTarget + r.plannedTarget,
        effectiveTarget: t.effectiveTarget + r.effectiveTarget,
        actual: t.actual + r.actual,
        variance: 0,
      }),
      { plannedTarget: 0, effectiveTarget: 0, actual: 0, variance: 0 }
    );
    totals.variance = totals.actual - totals.effectiveTarget;

    return res.json({
      year,
      quarter,
      carryForward,
      months: rows,
      totals,
    });
  } catch (err) {
    console.error("getQuarterProgress error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
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
  getQuarterProgress,
  getMeetingCount,
};
