const Leads = require("../models/Leads");

const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      jobProfile,
      companyName,
      status,
      type,
      category,
      credentialDeckDate,
      discoveryCallDate,
      pitchDate,
      attachments,
      remark,
      followUp,
    } = req.body;

    const lead = await Leads.create({
      name,
      email,
      jobProfile,
      companyName,
      status,
      type,
      category,
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
    const { status, type, category, page = 1, limit = 20 } = req.query;

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
    const lead = await Leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    lead.name = req.body.name || lead.name;
    lead.status = req.body.status || lead.status;
    lead.type = req.body.type || lead.type;
    lead.category = req.body.category || lead.category;
    lead.credentialDeckDate = req.body.credentialDeckDate || lead.credentialDeckDate;
    lead.discoveryCallDate = req.body.discoveryCallDate || lead.discoveryCallDate;
    lead.pitchDate = req.body.pitchDate || lead.pitchDate;
    lead.attachments = req.body.attachments || lead.attachments;
    lead.remark = req.body.remark || lead.remark;
    lead.followUp = req.body.followUp || lead.followUp;
    await lead.save();
    return res.json({ message: "Lead updated successfully", lead });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createLead, updateLead, getLeads, getLead };
