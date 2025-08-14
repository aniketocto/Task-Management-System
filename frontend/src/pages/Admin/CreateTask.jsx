import React, { useCallback, useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PRIORITY_OPTIONS, TASK_TYPE } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { LuTrash } from "react-icons/lu";
import SelectOption from "../../components/Inputs/SelectOption";
import SelectUsers from "../../components/Inputs/SelectUsers";
import TodoListInput from "../../components/Inputs/TodoListInput";
import AddAttachmentInputs from "../../components/Inputs/AddAttachmentInputs";
import moment from "moment";
import { UserContext } from "../../context/userContext";
import Modal from "../../components/layouts/Modal";
import DeleteAlert from "../../components/layouts/DeleteAlert";
import TaskDueDateField from "../../components/Inputs/TaskDueDateField";
import CompanySelect from "components/Inputs/CompanySelect";
import AddReference from "components/Inputs/AddReference";
import AddRemarks from "components/Inputs/AddRemarks";
import { GrPowerReset } from "react-icons/gr";

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem("taskManagerToken") },
  transports: ["websocket"], // skip HTTP polling
  withCredentials: true,
});

const CreateTask = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const { taskId } = location.state || {};
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    companyName: "",
    priority: "low",
    dueDate: null,
    dueDateStatus: "",
    pendingDueDate: null,
    reason: "",
    assignedTo: [],
    todoChecklist: [],
    attachments: [],
    createdAt: null,
    serialNumber: null,
    taskCategory: "",
    objective: "",
    creativeSizes: "",
    targetAudience: "",
    usps: "",
    competetors: "",
    channels: "",
    smp: "",
    referance: [],
    remarks: [],
  });

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [createdBy, setCreatedBy] = useState(false);

  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    setTaskData({
      title: "",
      description: "",
      companyName: "",
      priority: "low",
      dueDate: null,
      dueDateStatus: "",
      pendingDueDate: null,
      reason: "",
      assignedTo: [],
      todoChecklist: [],
      attachments: [],
      taskCategory: "",
      objective: "",
      creativeSizes: "",
      targetAudience: "",
      usps: "",
      competetors: "",
      channels: "",
      smp: "",
      referance: [],
      remarks: [],
    });
  };

  // Create Tasks
  const createTask = async () => {
    setLoading(true);
    clearData();

    try {
      const todoList = taskData.todoChecklist?.map((item) => ({
        text: item.text,
        completed: item.completed || false, // ✅ preserve completed state
        assignedTo: item.assignedTo || [],
      }));

      const response = await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        ...taskData,
        dueDate: new Date(taskData.dueDate).toISOString(),
        todoChecklist: todoList,
      });

      if (response.status === 200) {
        toast.success("Task created successfully");
        clearData();
        navigate("/admin/tasks");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update Tasks
  const updateTask = async () => {
    setLoading(true);
    try {
      const todoList = taskData.todoChecklist
        ?.filter((item) => item?.text?.trim())
        .map((item) => {
          const prevTodoCheckList = currentTask?.todoChecklist || [];
          const matchedTask = item._id
            ? prevTodoCheckList.find((task) => task._id === item._id)
            : null;

          return {
            _id: item._id, // important for backend merge
            text: item.text,
            completed: matchedTask
              ? matchedTask.completed
              : item.completed || false,
            assignedTo:
              Array.isArray(item.assignedTo) && item.assignedTo.length > 0
                ? item.assignedTo
                : matchedTask?.assignedTo || [],
            approval: item.approval ||
              matchedTask?.approval || { status: "pending" },
          };
        });

      const payload = {
        ...taskData,
        todoChecklist: todoList,
      };

      if (user?.role !== "superAdmin") {
        delete payload.dueDate;
      }

      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_BY_ID(taskId),
        payload
      );

      if (response.status === 200) {
        toast.success("Task updating successfully");
        // clearData();
        // navigate("/admin/tasks");
      }
    } catch (error) {
      toast.error("Error updating task. Task not updated");
      console.error("Error updating task:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    setError([]);

    // Input Validation
    if (!taskData.companyName) {
      setError((prevError) => [...prevError, "Please select company name"]);
      return;
    }

    if (!taskData.title.trim()) {
      setError((prevError) => [...prevError, "Please enter task title"]);
      return;
    }
    if (!taskData.dueDate) {
      setError((prevError) => [...prevError, "Please select due date"]);
      return;
    }
    if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
      setError((prevError) => [...prevError, "Task is not assigned to anyone"]);
      return;
    }
    if (taskData.todoChecklist.length === 0 && user?.role !== "superAdmin") {
      setError((prevError) => [...prevError, "Please add todo checklist"]);
      return;
    }

    if (taskId) {
      updateTask();
      return;
    }

    createTask();
  };

  // get task by id
  const getTaskById = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(taskId)
      );

      if (response.data) {
        const taskInfo = response.data?.task;
        setCurrentTask({ taskInfo });

        setTaskData((prevData) => ({
          ...prevData,
          title: taskInfo.title,
          description: taskInfo.description,
          companyName: taskInfo.companyName,
          priority: taskInfo.priority,
          dueDate: taskInfo.dueDate
            ? moment(taskInfo.dueDate).format("YYYY-MM-DD")
            : null,
          dueDateStatus: taskInfo.dueDateStatus,
          pendingDueDate: taskInfo.pendingDueDate,
          reason: taskInfo.reason,
          // assignedTo: taskInfo.assignedTo?.map((user) => user?._id) || [],
          assignedTo: taskInfo.assignedTo || [], // ✅ full objects
          todoChecklist: taskInfo.todoChecklist || [],
          attachments: taskInfo.attachments || [],
          createdAt: taskInfo.createdAt,
          serialNumber: taskInfo.serialNumber,
          taskCategory: taskInfo.taskCategory,
          objective: taskInfo.objective,
          creativeSizes: taskInfo.creativeSizes,
          targetAudience: taskInfo.targetAudience,
          usps: taskInfo.usps,
          competetors: taskInfo.competetors,
          channels: taskInfo.channels,
          smp: taskInfo.smp,
          referance: taskInfo.referance || [],
          remarks: taskInfo.remarks || [],
        }));

        getUserbyId(taskInfo.createdBy);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    }
  }, [taskId]);

  const getUserbyId = async (userId) => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.USERS.GET_USER_BY_ID(userId)
      );
      const user = response.data;
      setCreatedBy(user?.name);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance
      .get(API_PATHS.USERS.GET_ALL_USERS)
      .then((res) => setAllUsers(res.data || []))
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleReview = async (approve) => {
    setLoading(true);
    try {
      await axiosInstance.patch(
        API_PATHS.DUE_DATE.REVIEW_DUE_DATE_CHANGE(taskId),
        {
          approve,
        }
      );

      toast.success(
        approve
          ? "Due date approved successfully"
          : "Due date rejected successfully"
      );

      // update task duedate status
      setCurrentTask((prev) => ({
        ...prev,
        dueDateStatus: approve ? "approved" : "rejected",
        pendingDueDate: null,
      }));
      setTaskData((prev) => ({
        ...prev,
        dueDateStatus: approve ? "approved" : "rejected",
        pendingDueDate: null,
      }));

      await getTaskById();
    } catch (error) {
      console.error("Review failed:", error.response?.data);
      toast.error(error.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // Delete Task
  const deleteTask = async () => {
    try {
      const response = await axiosInstance.delete(
        API_PATHS.TASKS.DELETE_TASK_BY_ID(taskId)
      );

      if (response) {
        setOpenDeleteAlert(false);
        toast.success("Task deleted successfully");
        navigate("/admin/tasks");
      }
    } catch (error) {
      toast.error("Error deleting task. Task not deleted");
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    clearData();
    if (taskId) {
      getTaskById();
    }
    return () => {};
  }, [taskId, getTaskById]);

  const handleChecklistApprove = async (taskId, checklistId, currentStatus) => {
    // const newStatus = currentStatus === "approved" ? "rejected" : "approved";
    try {
      const res = await axiosInstance.patch(
        API_PATHS.APPROVAL.CHECKLIST_APPROVAL(taskId, checklistId),
        { status: currentStatus }
      );
      // Update local taskData.todoChecklist with the API’s response
      setTaskData((prev) => ({
        ...prev,
        todoChecklist: res.data.task.todoChecklist,
      }));
    } catch (err) {
      console.error("Checklist approval failed:", err);
    }
  };

  useEffect(() => {
    socket.on("task:sync", () => {
      getTaskById();
      console.log("task:sync");
    });

    return () => {
      socket.off("task:sync"); // clean up
    };
  }, [getTaskById]);

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="mt-5">
        <div className="grid grid-cols-1  mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl text-white font-medium">
                  {taskId ? "Update Task" : "Create Task"} :{" "}
                  {taskData.serialNumber}
                </h2>
                {taskId && (
                  <p className="text-white text-xs font-regular">
                    Created By: {createdBy} on{" "}
                    {moment(taskData.createdAt).format("DD MMMM YYYY")}
                  </p>
                )}
              </div>

              {taskId && user?.role === "superAdmin" && (
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer"
                  onClick={() => setOpenDeleteAlert(true)}
                >
                  <LuTrash className="text-base" /> Delete
                </button>
              )}
            </div>

            {/* Company */}

            <div className="mt-4">
              <label className="text-xs font-medium text-slate-200">
                Company <sup className="text-red-500 text-xs">*</sup>
              </label>
              <CompanySelect
                value={taskData.companyName}
                onChange={(newCompany) =>
                  handleValueChange("companyName", newCompany)
                }
              />
            </div>

            {/* Title */}
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-200">
                Task Title <sup className="text-red-500 text-xs">*</sup>
              </label>

              <input
                placeholder="Task Title"
                className="form-input"
                value={taskData.title}
                onChange={({ target }) => {
                  handleValueChange("title", target.value);
                }}
              />
            </div>

            <div className="col-span-12 md:col-span-4 mt-4">
              <label className="text-xs font-medium text-slate-200">
                Type <sup className="text-red-500 text-xs">*</sup>
              </label>

              <div className="flex gap-2">
                <SelectOption
                  options={TASK_TYPE}
                  value={taskData.taskCategory}
                  onChange={(value) => handleValueChange("taskCategory", value)}
                  placeholder="Select Type"
                  disabled={!!taskData.taskCategory}
                />
                {taskData.taskCategory && (
                  <button
                    type="button"
                    onClick={() => handleValueChange("taskCategory", "")}
                  >
                    <GrPowerReset className="text-2xl text-gray-200 rounded cursor-pointer" />
                  </button>
                )}
              </div>
            </div>

            {taskData.taskCategory ? (
              taskData.taskCategory === "operational" ? (
                <div className="mt-3">
                  <label className="text-xs font-medium text-slate-200">
                    Brief <sup className="text-red-500 text-xs">*</sup>
                  </label>
                  <textarea
                    placeholder="Descripe Brief"
                    className="form-input"
                    rows={4}
                    value={taskData.description}
                    onChange={({ target }) => {
                      handleValueChange("description", target.value);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      Creative Sizes <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="Creative Sizes"
                      className="form-input"
                      rows={1}
                      value={taskData.creativeSizes}
                      onChange={({ target }) => {
                        handleValueChange("creativeSizes", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      Objective / Goal <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="Whats the goal of this task?"
                      className="form-input"
                      rows={1}
                      value={taskData.objective}
                      onChange={({ target }) => {
                        handleValueChange("objective", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      Target Audience <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="Who is the target audience?"
                      className="form-input"
                      rows={1}
                      value={taskData.targetAudience}
                      onChange={({ target }) => {
                        handleValueChange("targetAudience", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      Unique Selling Points <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="What are the unique selling points?"
                      className="form-input"
                      rows={1}
                      value={taskData.usps}
                      onChange={({ target }) => {
                        handleValueChange("usps", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      Competetors <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="Who are our competetors?"
                      className="form-input"
                      rows={1}
                      value={taskData.competetors}
                      onChange={({ target }) => {
                        handleValueChange("competetors", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      Channels <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="Channels"
                      className="form-input"
                      rows={1}
                      value={taskData.channels}
                      onChange={({ target }) => {
                        handleValueChange("channels", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-slate-200">
                      SMPs <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <textarea
                      placeholder="SMPs"
                      className="form-input"
                      rows={1}
                      value={taskData.smp}
                      onChange={({ target }) => {
                        handleValueChange("smp", target.value);
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-slate-200">
                      Reference <sup className="text-red-500 text-xs">*</sup>
                    </label>
                    <AddReference
                      referance={taskData?.referance}
                      setReference={(value) => {
                        if (!Array.isArray(value)) {
                          console.error(
                            `Invalid value for referance:`,
                            value,
                            typeof value
                          );
                          throw new Error("referance must be array");
                        }
                        handleValueChange("referance", value);
                      }}
                    />
                  </div>
                </>
              )
            ) : (
              <p></p>
            )}

            {/* Priority DueDate AssignTo */}
            <div className="grid grid-cols-12 gap-4 mt-2">
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-200">
                  Priority <sup className="text-red-500 text-xs">*</sup>
                </label>

                <SelectOption
                  options={PRIORITY_OPTIONS}
                  value={taskData.priority}
                  onChange={(value) => handleValueChange("priority", value)}
                  placeholder="Select Priority"
                />
              </div>
              {/* Due Date */}

              <TaskDueDateField
                taskId={taskId}
                taskData={taskData}
                handleValueChange={handleValueChange}
              />
              {/* Assigned To */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-200">
                  Assign Owner <sup className="text-red-500 text-xs">*</sup>
                </label>

                <SelectUsers
                  selectedUsers={taskData.assignedTo}
                  setSelectedUsers={(selectedUsers) =>
                    handleValueChange("assignedTo", selectedUsers)
                  }
                  allUsers={allUsers}
                  loading={loadingUsers}
                  role="admin"
                />
              </div>
            </div>

            {user?.role === "superAdmin" &&
              taskData.dueDateStatus === "pending" && (
                <>
                  <div className="mt-4 flex items-center space-x-4">
                    <span className="text-yellow-400 text-sm">
                      Deadline shift to:{" "}
                      {moment(taskData.pendingDueDate).format("YYYY-MM-DD")}
                    </span>
                    <button
                      onClick={() => handleReview(true)}
                      disabled={loading}
                      className="cursor-pointer px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(false)}
                      disabled={loading}
                      className="cursor-pointer px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                  <p>{taskData.rea}</p>
                </>
              )}

            {/* Checklist */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-200">
                Checklist <sup className="text-red-500 text-xs">*</sup>
              </label>

              <TodoListInput
                taskId={taskId}
                todoList={taskData?.todoChecklist}
                setTodoList={(value) => {
                  if (!Array.isArray(value)) {
                    console.error(
                      `Invalid value for todoChecklist:`,
                      value,
                      typeof value
                    );
                    throw new Error("todoChecklist must be array");
                  }

                  handleValueChange("todoChecklist", value);
                }}
                onChecklistApprove={handleChecklistApprove}
              />
            </div>

            {/* Attachments */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-200">
                Attachments 
              </label>

              <AddAttachmentInputs
                attachments={taskData?.attachments}
                setAttachments={(value) => {
                  if (!Array.isArray(value)) {
                    console.error(
                      `Invalid value for attachments:`,
                      value,
                      typeof value
                    );
                    throw new Error("attachments must be array");
                  }
                  handleValueChange("attachments", value);
                }}
              />
            </div>

            {/* Remarks */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-200">
                Remarks
              </label>

              <AddRemarks
                remarks={taskData?.remarks}
                setRemarks={(value) => {
                  if (!Array.isArray(value)) {
                    console.error(
                      `Invalid value for attachments:`,
                      value,
                      typeof value
                    );
                    throw new Error("attachments must be array");
                  }
                  handleValueChange("remarks", value);
                }}
              />
            </div>

            {Array.isArray(error) && error.length > 0 && (
              <ul className="text-red-500 text-sm pb-2.5">
                {error.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            )}

            <div className="flex justify-end mt-7">
              <button
                className="add-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {taskId ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Task"
      >
        <DeleteAlert
          content="Are you sure sure you want to delete this task"
          onDelete={() => deleteTask()}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default CreateTask;
