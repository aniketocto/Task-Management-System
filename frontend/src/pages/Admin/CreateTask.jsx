import React, { useContext, useEffect, useState } from "react";
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
import moment from "moment";
import { UserContext } from "../../context/userContext";
import Modal from "../../components/layouts/Modal";
import DeleteAlert from "../../components/layouts/DeleteAlert";
import TaskDueDateField from "../../components/Inputs/TaskDueDateField";

const CreateTask = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const { taskId } = location.state || {};
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "low",
    dueDate: null,
    dueDateStatus: "",
    pendingDueDate: null,
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
      dueDateStatus,
      pendingDueDate,
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
      const todoList = taskData.todoChecklist?.map((item) => {
        const prevTodoCheckList = currentTask?.todoChecklist || [];
        const matchedTask = prevTodoCheckList.find(
          (task) => task.text === item
        );

        return {
          text: item.text,
          completed: matchedTask ? matchedTask.completed : false,
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
        clearData();
        navigate("/admin/tasks");
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
  const getTaskById = async () => {
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
          priority: taskInfo.priority,
          dueDate: taskInfo.dueDate
            ? moment(taskInfo.dueDate).format("YYYY-MM-DD")
            : null,
          dueDateStatus: taskInfo.dueDateStatus,
          pendingDueDate: taskInfo.pendingDueDate,
          assignedTo: taskInfo.assignedTo?.map((user) => user?._id) || [],
          todoChecklist: taskInfo.todoChecklist || [],
          attachments: taskInfo.attachments || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching task:", error);
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
    if (taskId) {
      getTaskById();
    }
    return () => {};
  }, [taskId]);

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl text-white font-medium">
                {taskId ? "Update Task" : "Create Task"}
              </h2>
              {taskId && (
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer"
                  onClick={() => setOpenDeleteAlert(true)}
                >
                  <LuTrash className="text-base" /> Delete
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

              <TaskDueDateField
                taskId={taskId}
                taskData={taskData}
                handleValueChange={handleValueChange}
              />
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
