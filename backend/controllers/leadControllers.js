const categoryModel = require("../models/categoryModel");
const Leads = require("../models/Leads");

const createLead = async (req, res) => {
  try {
    const {
      cName,
      email,
      jobProfile,
      companyName,
      status,
      type,
      category,
      leadCameDate,
      credentialDeckDate,
      discoveryCallDate,
      pitchDate,
      attachments,
      remark,
      followUp,
    } = req.body;

    const lead = await Leads.create({
      cName,
      email,
      jobProfile,
      companyName,
      status,
      type,
      category,
      leadCameDate,
      credentialDeckDate,
      discoveryCallDate,
      pitchDate,
      attachments,
      remark,
      followUp,
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

const updateLead = async (req, res) => {
  try {
    const updateFields = {
      cName: req.body.cName,
      jobProfile: req.body.jobProfile,
      companyName: req.body.companyName,
      status: req.body.status,
      type: req.body.type,
      category: req.body.category,
      leadCameDate: req.body.leadCameDate,
      credentialDeckDate: req.body.credentialDeckDate,
      discoveryCallDate: req.body.discoveryCallDate,
      pitchDate: req.body.pitchDate,
      attachments: req.body.attachments,
      remark: req.body.remark,
    };

    if (req.body.followUp) {
      updateFields.followUp = req.body.followUp;
    }

    const lead = await Leads.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json({ message: "Lead updated successfully", lead });
  } catch (error) {
    console.error("Error updating lead:", error);
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
    const followUpLeads = await Leads.countDocuments({ status: "followUp" });
    const deadLeads = await Leads.countDocuments({ status: "dead" });
    const onboardedLeads = await Leads.countDocuments({ status: "onboarded" });
    const argumentLeads = await Leads.countDocuments({ status: "argument" });
    const pitchLeads = await Leads.countDocuments({ status: "pitch" });

    const leadStatuses = ["followUp", "dead", "onboarded", "argument", "pitch"];

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

    const recentLeads = await Leads.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "companyName status type credentialDeckDate discoveryCallDate pitchDate attachments"
      );

    res.json({
      statistic: {
        totalLeads,
        followUpLeads,
        deadLeads,
        onboardedLeads,
        argumentLeads,
        pitchLeads,
      },
      charts: {
        leadDistribution,
      },
      recentLeads,
    });
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
};
