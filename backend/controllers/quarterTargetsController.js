const QuarterTarget = require("../models/QuarterTarget");

const QUARTER_MONTHS = {
  JFM: [1, 2, 3],
  AMJ: [4, 5, 6],
  JAS: [7, 8, 9],
  OND: [10, 11, 12],
};

const validateMonths = (year, quarter, months) => {
  const expected = QUARTER_MONTHS[quarter];
  const key = new Set(months.map((m) => `${m.year}-${m.month}`));
  const expectedKey = new Set(expected.map((m) => `${year}-${m}`));
  if (key.size !== 3) return false;
  for (const k of expectedKey) if (!key.has(k)) return false;
  return true;
};

const upsertQuaterTarget = async (req, res) => {
  try {
    const { year, quarter, carryForward = true, months = [] } = req.body;
    if (!year || !quarter || !QUARTER_MONTHS[quarter]) {
      return res.status(400).json({
        message: "Valid year and quarter (JFM/AMJ/JAS/OND) are required.",
      });
    }
    if (!validateMonths(year, quarter, months)) {
      return res
        .status(400)
        .json({ message: "months must be the 3 exact months of the quarter." });
    }

    // Canonical order
    const orderedMonths = QUARTER_MONTHS[quarter].map((m) => {
      const found = months.find((x) => x.year === year && x.month === m) || {};
      return { year, month: m, target: Number(found.target) || 0 };
    });

    const doc = await QuarterTarget.findOneAndUpdate(
      { year, quarter },
      {
        year,
        quarter,
        carryForward: !!carryForward,
        months: orderedMonths,
        createdBy: req.user?._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const io = req.app.get("io");
    if (io)
      io.emit("lead:sync", {
        source: "targets" | "leads",
      });

    res.json({ message: "Quarter targets saved", id: doc._id, quarter: doc });
  } catch (err) {
    console.error("upsertQuarterTarget:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getQuarterTarget = async (req, res) => {
  try {
    const { year, quarter } = req.query;
    if (!year || !quarter || !QUARTER_MONTHS[quarter]) {
      return res.status(400).json({
        message: "Valid year and quarter (JFM/AMJ/JAS/OND) are required.",
      });
    }
    const doc = await QuarterTarget.findOne({
      year: Number(year),
      quarter,
    }).lean();
    if (doc) return res.json(doc);

    // stub if not set
    return res.json({
      year: Number(year),
      quarter,
      carryForward: true,
      months: QUARTER_MONTHS[quarter].map((m) => ({
        year: Number(year),
        month: m,
        target: 0,
      })),
      _id: null,
      createdAt: null,
      updatedAt: null,
    });
  } catch (err) {
    console.error("getQuarterTarget:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { upsertQuaterTarget, getQuarterTarget, QUARTER_MONTHS };
