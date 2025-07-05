const Task = require("../models/Task");
const User = require("../models/User");
const excelJS = require("exceljs");

const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Reports");

    worksheet.columns = [
      { header: "Task ID", key: "id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Assigned To", key: "assignedTo.name", width: 20 },
      { header: "Priority", key: "priority", width: 20 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 },
    ];

    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        .map((user) => `${user.name} (${user.email})`)
        .join(", ");
      worksheet.addRow({
        id: task._id,
        title: task.title,
        description: task.description,
        assignedTo: assignedTo,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const now = new Date();
    const year = now.getFullYear();
    const monthName = months[now.getMonth()]; // e.g., "June"
    const day = String(now.getDate()).padStart(2, "0");

    const fileName = `tasks-report-${day}-${monthName}-${year}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    return workbook.xlsx.write(res).then(() => res.end());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting task report", error: error.message });
  }
};

const exportUsersReport = async (req, res) => {
  try {
    const users = await User.find().select("name email department").lean();
    const userTasks = await Task.find()
      .populate("assignedTo", "name email")
      .lean();

    const userTaskMap = {};

    users.forEach((user) => {
      userTaskMap[user._id] = {
        name: user.name,
        email: user.email,
        department: user.department,
        taskCount: 0,
        pendingTask: 0,
        completedTask: 0,
        inProgressTask: 0,
        delayedTask: 0,
      };
    });

    userTasks.forEach((task) => {
      if (task.assignedTo) {
        task.assignedTo.forEach((assignedUser) => {
          userTaskMap[assignedUser._id].taskCount++;
          if (task.status === "pending")
            userTaskMap[assignedUser._id].pendingTask++;
          if (task.status === "completed")
            userTaskMap[assignedUser._id].completedTask++;
          if (task.status === "inProgress")
            userTaskMap[assignedUser._id].inProgressTask++;
          if (task.status === "delayed")
            userTaskMap[assignedUser._id].delayedTask++;
        });
      }
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Task Reports");

    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 50 },
      { header: "Total Task Count", key: "taskCount", width: 20 },
      { header: "Pending Task", key: "pendingTask", width: 20 },
      { header: "Completed Task", key: "completedTask", width: 20 },
      { header: "In Progress Task", key: "inProgressTask", width: 20 },
      { header: "Delayed Task", key: "delayedTask", width: 20 },
    ];

    Object.values(userTaskMap).forEach((user) => {
      worksheet.addRow(user);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const now = new Date();
    const year = now.getFullYear();
    const monthName = months[now.getMonth()]; // e.g., "June"
    const day = String(now.getDate()).padStart(2, "0");

    const fileName = `tasks-report-${day}-${monthName}-${year}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    return workbook.xlsx.write(res).then(() => res.end());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting user report", error: error.message });
  }
};

module.exports = { exportTasksReport, exportUsersReport };
