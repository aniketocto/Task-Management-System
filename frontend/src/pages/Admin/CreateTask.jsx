import React, { useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PRIORITY_OPTIONS } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { LuTrash } from "react-icons/lu";
import SelectOption from "../../components/Inputs/SelectOption";
import SelectUsers from "../../components/Inputs/SelectUsers";
import TodoListInput from "../../components/Inputs/TodoListInput";
import AddAttachmentInputs from "../../components/Inputs/AddAttachmentInputs";

const CreateTask = () => {
  const location = useLocation();
  const { taskId } = location.state || {};
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "low",
    dueDate: null,
    assignedTo: [],
    todoChecklist: [],
    attachments: [],
  });

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "low",
      dueDate: null,
      assignedTo: [],
      todoChecklist: [],
      attachments: [],
    });
  };

  // Create Tasks
  const createTask = async () => {
    setLoading(true);

    try {
      const todoList = taskData.todoChecklist?.map((item) => ({
        text: item,
        completed: false,
      }));

      const response = await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        ...taskData,
        dueDate: new Date(taskData.dueDate).toISOString(),
        todoChecklist: todoList,
      });

      if (response.status === 201) {
        toast.success("Task created successfully");
        clearData();
        // navigate("/admin/tasks");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update Tasks
  const updateTask = async () => {};

  const handleSubmit = async () => {
    setError([]);

    // Input Validation
    if (!taskData.title.trim()) {
      setError((prevError) => [...prevError, "Please enter task title"]);
      return;
    }
    if (!taskData.description.trim()) {
      setError((prevError) => [...prevError, "Please enter task description"]);
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
    if (taskData.todoChecklist.length === 0) {
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
  const getTaskById = async () => {};

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-medium">
                {taskId ? "Update Task" : "Create Task"}
              </h2>
              {taskId && (
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer"
                  onClick={() => setOpenDeleteAlert(true)}
                >
                  <LuTrash className="text-base" />
                </button>
              )}
            </div>

            {/* Title */}
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600">
                Task Title
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

            {/* Descrption */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>

              <textarea
                placeholder="Describe Task"
                className="form-input"
                rows={4}
                value={taskData.description}
                onChange={({ target }) => {
                  handleValueChange("description", target.value);
                }}
              />
            </div>

            {/* Priority DueDate AssignTo */}
            <div className="grid grid-cols-12 gap-4 mt-2">
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Priority
                </label>

                <SelectOption
                  options={PRIORITY_OPTIONS}
                  value={taskData.priority}
                  onChange={(value) => handleValueChange("priority", value)}
                  placeholder="Select Priority"
                />
              </div>
              {/* Due Date */}
              <div className="col-span-12 md:col-span-4 ">
                <label className="text-xs font-medium text-slate-600">
                  Due Date
                </label>

                <input
                  type="date"
                  className="form-input"
                  value={taskData.dueDate ?? ""}
                  onChange={({ target }) => {
                    handleValueChange("dueDate", target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {/* Assigned To */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Assign To
                </label>

                <SelectUsers
                  selectedUsers={taskData.assignedTo}
                  setSelectedUsers={(selectedUsers) =>
                    handleValueChange("assignedTo", selectedUsers)
                  }
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Checklist
              </label>

              <TodoListInput
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
              />
            </div>

            {/* Attachments */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
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
    </DashboardLayout>
  );
};

export default CreateTask;
