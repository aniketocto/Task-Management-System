const { Opening, Interview, HrDoc } = require("../models/Interview");

// Openings
const createOpening = async (req, res) => {
  try {
    const { title, department, headcount, status } = req.body;

    if (!title || typeof headcount === "undefined") {
      return res.status(400).json({
        message: "title and headcount are required",
      });
    }
    if (Number(headcount) < 1) {
      return res.status(400).json({
        message: "headcount must be at least 1",
      });
    }

    const opening = await Opening.create({
      title: title.trim(),
      department: department?.trim(),
      headcount: Number(headcount),
      status: status || "open",
    });

    res.status(201).json({
      message: "Opening created successfully",
      data: opening,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create opening",
      error: error?.message || "Server error",
    });
  }
};

const getAllOpenings = async (req, res) => {
  try {
    const openings = await Opening.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "All openings fetched successfully",
      data: openings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch openings",
      error: error?.message || "Server error",
    });
  }
};

const updateOpening = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const { title, department, headcount, status } = req.body;

    if (!title || typeof headcount === "undefined") {
      return res.status(400).json({
        message: "title and headcount are required",
      });
    }
    if (Number(headcount) < 1) {
      return res.status(400).json({
        message: "headcount must be at least 1",
      });
    }

    const opening = await Opening.findById(id);
    if (!opening) {
      return res.status(404).json({ message: "Opening not found" });
    }

    // Permission Check
    if (role !== "admin" && role !== "superAdmin") {
      return res.status(403).json({
        message: "You do not have permission to update openings",
      });
    }

    // Admin - limited fields
    if (role === "admin") {
      opening.headcount = Number(headcount);
      opening.status = status || "open";
    }

    // Super Admin - full update
    if (role === "superAdmin") {
      opening.title = title.trim();
      opening.department = department?.trim();
      opening.headcount = Number(headcount);
      opening.status = status || "open";
    }

    await opening.save();

    res.status(200).json({
      message: "Opening updated successfully",
      data: opening,
      user: req.user.department,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteOpening = async (req, res) => {
  try {
    const { id } = req.params;
    await Opening.findByIdAndDelete(id);
    res.status(200).json({ message: "Opening deleted successfully" });
  } catch (error) {}
};

// Interviews

const createInterview = async (req, res) => {
  try {
    const { opening, candidateName, startTime, interviewers, status, rounds } =
      req.body;

    const interview = await Interview.create({
      opening,
      candidateName,
      startTime,
      rounds,
      interviewers,
      status,
    });

    res.status(201).json({
      message: "Interview created successfully",
      data: interview,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create interview",
      error: error?.message || "Server error",
    });
  }
};

const getAllInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField,
      sort = "desc",
      timeframe,
      start,
      end,
      cname,
    } = req.query;

    const filter = {};
    const startOfDay = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const endOfDay = (d) => {
      const x = new Date(d);
      x.setHours(23, 59, 59, 999);
      return x;
    };

    const now = new Date();
    let from, to;

    if (start || end) {
      if (start) from = new Date(start);
      if (end) to = new Date(end);
    } else if (timeframe) {
      switch (timeframe) {
        case "today": {
          from = startOfDay(now);
          to = endOfDay(now);
          break;
        }
        case "yesterday": {
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          from = startOfDay(y);
          to = endOfDay(y);
          break;
        }
        case "last7": {
          const s = new Date(now);
          s.setDate(s.getDate() - 7);
          from = s;
          to = now;
          break;
        }
        case "last30": {
          const s = new Date(now);
          s.setDate(s.getDate() - 30);
          from = s;
          to = now;
          break;
        }
        case "lastMonth": {
          const firstOfThisMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          const lastOfPrevMonth = new Date(firstOfThisMonth - 1);
          from = new Date(
            lastOfPrevMonth.getFullYear(),
            lastOfPrevMonth.getMonth(),
            1,
            0,
            0,
            0,
            0
          );
          to = new Date(
            lastOfPrevMonth.getFullYear(),
            lastOfPrevMonth.getMonth(),
            lastOfPrevMonth.getDate(),
            23,
            59,
            59,
            999
          );
          break;
        }
      }
    }

    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = from;
      if (to) filter.startTime.$lte = to;
    }

    if (cname && cname.trim()) {
      const safe = cname.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.candidateName = { $regex: safe, $options: "i" };
    }

    const sortDir = String(sort).toLowerCase() === "asc" ? 1 : -1;
    const validSortFields = ["startTime", "createdAt"];
    const sortKey = validSortFields.includes(sortField)
      ? sortField
      : "createdAt";
    const sortObj = { [sortKey]: sortDir };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Interview.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Interview.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: "Interviews fetched successfully",
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        sort: sortObj,
        timeframe: timeframe || (start || end ? "custom" : "all"),
        from: from || null,
        to: to || null,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch interviews",
      error: error?.message || "Server error",
    });
  }
};

const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, status, rounds, done } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (typeof startTime !== "undefined") {
      interview.startTime = startTime;
    }
    if (typeof status !== "undefined") {
      interview.status = status;
    }
    if (typeof rounds !== "undefined") {
      interview.rounds = rounds;
    }
    if (typeof done !== "undefined") {
      interview.done = done;
    }

    await interview.save();

    res.status(200).json({
      message: "Interview updated successfully",
      data: interview,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    await Interview.findByIdAndDelete(id);
    res.status(200).json({ message: "Interview deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getUpcomingInterviews = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const interviews = await Interview.find({
      startTime: {
        $gte: now,
        $lte: next7Days,
      },
    }).sort({ startTime: 1 });

    res.status(200).json({
      message: "Upcoming interviews in next 7 days fetched successfully",
      data: interviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch upcoming interviews",
      error: error?.message || "Server error",
    });
  }
};

const pickDefined = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => typeof v !== "undefined")
  );

const addOrUpdateDocs = async (req, res) => {
  try {
    const input = pickDefined({
      recruitmentReport: req.body.recruitmentReport,
      onBoarding: req.body.onBoarding,
      offBoarding: req.body.offBoarding,
      evalution: req.body.evalution,
      appraisal: req.body.appraisal,
      hrPolicies: req.body.hrPolicies,
      hrProcess: req.body.hrProcess,
      hrTraining: req.body.hrTraining,
      reimbursement: req.body.reimbursement,
      pettyCash: req.body.pettyCash,
      employeeExitForm: req.body.employeeExitForm,
    });

    const doc = await HrDoc.findOneAndUpdate(
      { singleton: "HRDOC_SINGLETON" },
      {
        $set: input,
        $setOnInsert: { singleton: "HRDOC_SINGLETON" },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    return res.status(200).json({
      message: "HR Docs added/updated successfully",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getDocs = async (_req, res) => {
  try {
    const doc = await HrDoc.findOne({ singleton: "HRDOC_SINGLETON" }).lean();

    if (!doc) {
      const created = await HrDoc.create({});
      return res.status(200).json({
        message: "HR Docs fetched successfully",
        data: created.toObject(),
      });
    }

    return res.status(200).json({
      message: "HR Docs fetched successfully",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOpening,
  getAllOpenings,
  updateOpening,
  deleteOpening,
  createInterview,
  getAllInterviews,
  updateInterview,
  deleteInterview,
  getUpcomingInterviews,
  addOrUpdateDocs,
  getDocs,
};
