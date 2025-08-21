const {
  ActivityChannel,
  LeadReports,
  Event,
} = require("../models/LeadReports");

const pickDefined = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => typeof v !== "undefined")
  );

const addOrUpdateDocs = async (req, res) => {
  try {
    const input = pickDefined({
      coldCalling: req.body.coldCalling,
      emailMarketing: req.body.emailMarketing,
      whatsappMarketing: req.body.whatsappMarketing,
      entireDb: req.body.entireDb,
    });

    const doc = await LeadReports.findOneAndUpdate(
      { singleton: "LeadReports_SINGLETON" },
      {
        $set: input,
        $setOnInsert: { singleton: "LeadReports_SINGLETON" },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    return res.status(200).json({
      message: "Lead Reports Docs added/updated successfully",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getDocs = async (req, res) => {
  try {
    const doc = await LeadReports.findOne({
      singleton: "LeadReports_SINGLETON",
    }).lean();
    return res.status(200).json({
      message: "Lead Reports Docs fetched successfully",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addEvent = async (req, res) => {
  try {
    const { eventName, industry, pass, expense, leadReport } = req.body;
    const event = await Event.create({
      eventName,
      industry,
      pass,
      expense,
      leadReport,
    });
    res.status(201).json({
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventName, industry, pass, expense, leadReport } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (typeof eventName !== "undefined") event.eventName = eventName;
    if (typeof industry !== "undefined") event.industry = industry;
    if (typeof pass !== "undefined") event.pass = pass;
    if (typeof expense !== "undefined") event.expense = expense;
    if (typeof leadReport !== "undefined") event.leadReport = leadReport;

    await event.save();

    res.status(200).json({
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createChannelRow = async (req, res) => {
  try {
    const newRow = new ActivityChannel(req.body);
    await newRow.save();
    res.status(201).json(newRow);
  } catch (error) {
    console.error("Error creating channel row:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getChannelRows = async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2025-08"

    if (!month) {
      return res
        .status(400)
        .json({ message: "month is required in YYYY-MM format" });
    }

    // ✅ now just query by month field
    const rows = await ActivityChannel.find({ month }).sort({ leadSource: 1 });

    res.json({ rows });
  } catch (error) {
    console.error("Error fetching channel rows:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateChannelRow = async (req, res) => {
  try {
    const { month } = req.query;
    const { leadSource, ...fields } = req.body;

    if (!month) {
      return res
        .status(400)
        .json({ message: "month is required in YYYY-MM format" });
    }
    if (!leadSource) {
      return res.status(400).json({ message: "leadSource is required" });
    }

    const row = await ActivityChannel.findOneAndUpdate(
      { leadSource, month }, // 👈 direct filter by month + leadSource
      { $set: fields },
      { new: true, upsert: true } // 👈 create if not exists (optional)
    );

    res.status(200).json(row);
  } catch (error) {
    console.error("Error updating channel row:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addOrUpdateDocs,
  getDocs,
  addEvent,
  getEvents,
  deleteEvent,
  updateEvent,
  createChannelRow,
  getChannelRows,
  updateChannelRow,
};
