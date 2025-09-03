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
    return `weekly-${user}-${sopId}-${m.format("YYYY-WW")}`;
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

    const sops = await SOP.find(filter)
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "SOPs fetched successfully", data: sops });
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
    }).lean();

    const today = new Date();
    const completionKeys = sops.map((sop) =>
      generateCompletionKey(sop, user._id, today)
    );

    const completions = await SOPCompletion.find({
      completionKey: { $in: completionKeys },
    }).select("completionKey");

    const completedKeysSet = new Set(completions.map((c) => c.completionKey));

    const sopsWithStatus = sops.map((sop) => ({
      ...sop,
      isCompleted: completedKeysSet.has(
        generateCompletionKey(sop, user._id, today)
      ),
    }));

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
    const { id: sopId } = req.params;
    const userId = req.user._id;
    const { checked } = req.body;

    const sop = await SOP.findById(sopId);
    if (!sop) {
      return res.status(404).json({ message: "SOP not found" });
    }

    const completionKey = generateCompletionKey(sop, userId);

    if (checked) {
      await SOPCompletion.findOneAndUpdate(
        { completionKey },
        { sop: sopId, user: userId, completionKey, completedAt: new Date() },
        { upsert: true, new: true }
      );
      res.status(200).json({ message: "SOP marked as completed successfully" });
    } else {
      await SOPCompletion.findOneAndDelete({ completionKey });
      res.status(200).json({ message: "SOP marked as incomplete." });
    }
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
