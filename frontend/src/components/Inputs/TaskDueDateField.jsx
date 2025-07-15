import toast from "react-hot-toast";
import { UserContext } from "../../context/userContext";
import { useContext, useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/layouts/Modal";

const TaskDueDateField = ({ taskId, taskData, handleValueChange }) => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");

  //   reset the picker whenever we open
  useEffect(() => {
    if (isModalOpen) {
      setNewDate(taskData.dueDate?.split("T")[0] || "");
    }
  }, [isModalOpen, taskData.dueDate]);
  const submitRequest = async () => {
    try {
      await axiosInstance.post(
        API_PATHS.DUE_DATE.REQUEST_DUE_DATE_CHANGE(taskId),
        { pendingDueDate: newDate }
      );
      toast.success("Due date change request sent successfully");
      setIsModalOpen(false);
      handleValueChange("dueDateStatus", "pending");
    } catch (error) {
      console.error("Error requesting task due date:", error);
      const errorMessage =
        error.response?.data?.message || "Error requesting task due date";
      toast.error(errorMessage);
    }
  };
  return (
    <>
      {/* Due Date Input */}
      <div className="col-span-12 md:col-span-4">
        <label className="text-xs font-medium text-slate-200">Due Date</label>

        <input
          type="date"
          disabled={taskId && user?.role !== "superAdmin"}
          className="form-input"
          value={taskData.dueDate?.split("T")[0] ?? ""}
          onChange={({ target }) => handleValueChange("dueDate", target.value)}
          min={new Date().toISOString().split("T")[0]}
        />

        {/* 1) If admin, show “Request Change” when the picker is disabled */}
        {user?.role === "admin" && taskId && (
          <button
            type="button"
            disabled={taskData.dueDateStatus === "pending"}
            onClick={() => setIsModalOpen(true)}
            className={`mt-1 px-3 py-1 text-sm  text-white rounded ${taskData.dueDateStatus === "pending" ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 cursor-pointer"}`}
          >
            {taskData.dueDateStatus === "pending" ? " Awaiting approval…" : "Request Change"}
          </button>
        )}

       
      </div>

      {/* 3) Modal for admins to pick & confirm the new date */}
      <Modal
        isOpen={isModalOpen}
        title="Request Due-Date Change"
        onClose={() => setIsModalOpen(false)}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            New Due Date
          </label>
          <input
            type="date"
            className="form-input w-full"
            min={new Date().toISOString().split("T")[0]}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[#eb4d4b] cursor-pointer text-white rounded"
            onClick={submitRequest}
            disabled={!newDate}
          >
            Submit Request
          </button>
        </div>
      </Modal>
    </>
  );
};

export default TaskDueDateField;
