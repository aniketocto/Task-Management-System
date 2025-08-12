const mongoose = require("mongoose");
const User = require("../models/User");

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const makeCompanyRegex = (txt) => new RegExp(escapeRegExp(txt), "i");

function resolveDateWindow({ month, timeframe, startDate, endDate }) {
  const now = new Date();

  if (month) {
    const [year, monthIndex] = month.split("-").map(Number);
    const start = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0); // e.g., Aug 1
    const end = new Date(year, monthIndex, 0, 23, 59, 59, 999); // Last day of month
    return { createdAt: { $gte: start, $lte: end } };
  }

  if (!timeframe) return {};

  switch (timeframe) {
    case "today": {
      const from = startOfDay(now);
      const to = now;
      return { createdAt: { $gte: from, $lte: to } };
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { createdAt: { $gte: startOfDay(y), $lte: endOfDay(y) } };
    }
    case "last7days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { createdAt: { $gte: from, $lte: now } };
    }
    case "last30days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { createdAt: { $gte: startOfDay(from), $lte: endOfDay(now) } };
    }
    case "custom": {
      if (startDate && endDate) {
        const from = startOfDay(new Date(startDate));
        const to = endOfDay(new Date(endDate));
        return { createdAt: { $gte: from, $lte: to } };
      }
      if (startDate && !endDate) {
        const from = startOfDay(new Date(startDate));
        const to = endOfDay(new Date(startDate));
        return { createdAt: { $gte: from, $lte: to } };
      }
      if (!startDate && endDate) {
        const from = startOfDay(new Date(endDate));
        const to = endOfDay(new Date(endDate));
        return { createdAt: { $gte: from, $lte: to } };
      }
      return {};
    }
    default:
      return {};
  }
}

async function buildTaskFilter(opts) {
  const {
    reqUser,
    department,
    userId,
    timeframe,
    month,
    startDate,
    endDate,
    status,
    priority,
    serialNumber,
    companyName,
  } = opts;

  const isPrivileged = reqUser.role === "superAdmin";
  const filter = isPrivileged
    ? {}
    : {
        $or: [
          { assignedTo: reqUser._id },
          { "todoChecklist.assignedTo": reqUser._id },
        ],
      };

  //   department wise
  if (department) {
    const users = await User.find({ department }).select("_id");
    const deptIds = users.map((u) => u._id);

    if (isPrivileged) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { assignedTo: { $in: deptIds } },
            { "todoChecklist.assignedTo": { $in: deptIds } },
          ],
        },
      ];
    } else {
      // For non-privileged, we do not widen visibility beyond ACL.
      // If they’re outside the dept, they’ll just see their own tasks due to ACL.
      // If you prefer returning empty instead, enforce: filter.assignedTo = reqUser._id
    }
  }

  //   user wise
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const target = new mongoose.Types.ObjectId(userId);
    filter.$or = [
      ...(filter.$or || []),
      { assignedTo: target },
      { "todoChecklist.assignedTo": target },
    ];
  }

  //   company wise
  if (companyName && companyName.trim()) {
    filter.companyName = makeCompanyRegex(companyName.trim());
  }
  Object.assign(
    filter,
    resolveDateWindow({ month, timeframe, startDate, endDate })
  );

  // Extras
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (serialNumber && serialNumber.trim()) {
    filter.serialNumber = new RegExp(
      "^" + escapeRegExp(serialNumber.trim()),
      "i"
    );
  }

  return filter;
}

module.exports = { buildTaskFilter };
