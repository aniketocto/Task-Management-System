const { default: mongoose } = require("mongoose");
const { SOP, SOPCompletion } = require("../models/Sops");
const User = require("../models/User");
const moment = require("moment-timezone");

const generateCompletionKey = (sop, userId, date = new Date()) => {
  const user = userId.toString();
  const sopId = sop._id ? sop._id.toString() : sop.toString();
  const m = moment(date).tz("Asia/Kolkata");

  if (sop.frequency === "daily") {
    return `daily-${user}-${sopId}-${m.format("YYYY-MM-DD")}`;
  }
  if (sop.frequency === "weekly") {
    const isoYear = m.isoWeekYear();
    const isoWeek = String(m.isoWeek()).padStart(2, "0");
    return `weekly-${user}-${sopId}-${isoYear}-W${isoWeek}`;
  }
  if (sop.frequency === "monthly") {
    return `monthly-${user}-${sopId}-${m.format("YYYY-MM")}`;
  }
  throw new Error("Invalid SOP frequency");
};

const createSOP = async (req, res) => {
  try {
    const { title, description, frequency, designation, assignedTo } = req.body;
    const newSop = new SOP({
      title,
      description,
      frequency,
      designation,
      assignedTo,
      createdBy: req.user._id,
    });
    await newSop.save();

    const io = req.app.get("io");
    if (io) io.emit("sop:sync", { action: "created", sopId: newSop._id });

    res.status(201).json({ message: "SOP created successfully", sop: newSop });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create SOP", error: error.message });
  }
};

const getSOPs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.designation) filter.designation = req.query.designation;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.frequency) filter.frequency = req.query.frequency;

    // Get SOPs with the applied filters
    const sops = await SOP.find(filter)
      .populate("assignedTo", "name designation")
      .sort({ createdAt: -1 });

    // Create base filter for counts (without frequency filter to get all frequency counts)
    const countFilter = {};
    if (req.query.designation) countFilter.designation = req.query.designation;
    if (req.query.assignedTo)
      countFilter.assignedTo = new mongoose.Types.ObjectId(
        req.query.assignedTo
      );
    // Note: We don't include frequency filter here so we can get counts for all frequencies

    // Get frequency counts with the same filters (except frequency)
    const frequencyCounts = await SOP.aggregate([
      { $match: countFilter }, // Apply the same filters except frequency
      {
        $group: {
          _id: "$frequency",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format frequency counts into a more readable structure
    const counts = {
      all: 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
    };

    frequencyCounts.forEach((item) => {
      counts[item._id] = item.count;
      counts.all += item.count;
    });

    res.status(200).json({
      message: "SOPs fetched successfully",
      data: sops,
      counts: counts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get SOPs", error: error.message });
  }
};

const updateSop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedSop = await SOP.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedSop) {
      return res.status(404).json({ message: "SOP not found" });
    }
    const io = req.app.get("io");
    if (io) io.emit("sop:sync", { action: "updated", sopId: updatedSop._id });
    res
      .status(200)
      .json({ message: "SOP updated successfully", sop: updatedSop });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update SOP", error: error.message });
  }
};

const deleteSop = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSop = await SOP.findByIdAndDelete(id);
    if (!deletedSop) {
      return res.status(404).json({ message: "SOP not found" });
    }
    await SOPCompletion.deleteMany({ sop: id });
    const io = req.app.get("io");
    if (io) io.emit("sop:sync", { action: "deleted", sopId: id });
    res
      .status(200)
      .json({ message: "SOP and related completions deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete SOP", error: error.message });
  }
};

const getCompletedSOPs = async (req, res) => {
  try {
    const { userId, designation, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // 1. Get users (filter if provided)
    let userFilter = {};
    if (userId) userFilter._id = userId;
    if (designation) userFilter.designation = designation;

    const users = await User.find(userFilter);
    const allSops = await SOP.find();

    let results = [];

    for (let user of users) {
      // 2. SOPs that apply to this user
      const userSOPs = allSops.filter(
        (sop) =>
          sop.designation === user.designation ||
          (sop.assignedTo && sop.assignedTo.toString() === user._id.toString())
      );

      // 3. Check each SOP’s completion status
      for (let sop of userSOPs) {
        const key = generateCompletionKey(sop, user._id, targetDate);
        const completion = await SOPCompletion.findOne({ completionKey: key });

        results.push({
          user: { id: user._id, name: user.name },
          sop: { id: sop._id, title: sop.title, frequency: sop.frequency },
          status: completion ? "completed" : "pending",
          completedAt: completion ? completion.completedAt : null,
        });
      }
    }

    res.json({ message: "SOPs with status", data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMySops = async (req, res) => {
  try {
    const user = req.user;
    const sops = await SOP.find({
      $or: [{ designation: user.designation }, { assignedTo: user._id }],
    })
      .populate("assignedTo", "name designation")
      .lean();

    const today = new Date();
    const completionKeys = sops.map((sop) =>
      generateCompletionKey(sop, user._id, today)
    );

    // fetch completions and include completedAt
    const completions = await SOPCompletion.find({
      completionKey: { $in: completionKeys },
    }).select("completionKey completedAt");

    // build a map from completionKey -> completedAt for quick lookup
    const completionMap = new Map(
      completions.map((c) => [c.completionKey, c.completedAt])
    );

    const sopsWithStatus = sops.map((sop) => {
      const key = generateCompletionKey(sop, user._id, today);
      return {
        ...sop,
        isCompleted: completionMap.has(key),
        completedAt: completionMap.get(key) || null,
      };
    });

    res.status(200).json({
      message: "User SOPs fetched successfully",
      data: sopsWithStatus,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get user SOPs", error: error.message });
  }
};

const toggleSopCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;
    const userId = req.user._id;
    const today = new Date();

    const sop = await SOP.findById(id);
    if (!sop) {
      return res.status(404).json({ message: "SOP not found" });
    }

    const completionKey = generateCompletionKey(sop, userId, today);

    let updatedAt = null;

    if (checked) {
      // mark complete
      const record = await SOPCompletion.findOneAndUpdate(
        { completionKey },
        { completionKey, user: userId, sop: sop._id, completedAt: today },
        { upsert: true, new: true }
      );
      updatedAt = record.completedAt;
    } else {
      // mark incomplete
      await SOPCompletion.deleteOne({ completionKey });
    }
    const io = req.app.get("io");
    if (io)
      io.emit("sop:sync", {
        action: "toggled",
        sopId: sop._id.toString(),
        userId: userId.toString(),
        checked,
      });

    res.status(200).json({
      message: checked ? "SOP marked as completed" : "SOP marked as incomplete",
      data: {
        _id: sop._id,
        isCompleted: checked,
        completedAt: checked ? updatedAt : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to toggle SOP completion",
      error: error.message,
    });
  }
};

module.exports = {
  createSOP,
  getSOPs,
  updateSop,
  deleteSop,
  getCompletedSOPs,
  getMySops,
  toggleSopCompletion,
};
