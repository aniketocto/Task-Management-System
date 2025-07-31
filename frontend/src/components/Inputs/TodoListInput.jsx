import React, { useContext, useState } from "react";
import { HiOutlineTrash, HiPlus } from "react-icons/hi";
import { LuCheck, LuX } from "react-icons/lu";
import SelectUsers from "./SelectUsers";
import { UserContext } from "../../context/userContext";

/**
 * Renders a list of todo checklist items with assignment and a single admin approval toggle.
 * Shows Approve/Reject buttons for new items (no approval yet), and a single toggle for items already approved/rejected.
 * @param {Array} todoList
 * @param {Function} setTodoList
 * @param {string} taskId
 * @param {Function} onChecklistApprove(taskId, itemId, status)
 */
const TodoListInput = ({
  todoList = [],
  setTodoList,
  taskId,
  onChecklistApprove,
}) => {
  const { user } = useContext(UserContext);
  const [option, setOption] = useState("");

  const handleAddOption = () => {
    if (!option.trim()) return;
    setTodoList([
      ...todoList,
      { text: option, completed: false, assignedTo: [] },
    ]);
    setOption("");
  };

  const handleRemoveOption = (index) => {
    setTodoList(todoList.filter((_, i) => i !== index));
  };

  const renderApprovalButtons = (item) => {
    const status = item.approval?.status || "pending";
    const disabled = !item.completed;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChecklistApprove(taskId, item._id, "approved")}
          className={` rounded border text-xl ${
            disabled
              ? "cursor-not-allowed text-gray-600 "
              : status === "approved"
              ? "text-green-600 cursor-pointer"
              : "text-gray-900 hover:text-gray-900 cursor-pointer"
          }`}
        >
          <LuCheck />
        </button>

        {/* Reject button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChecklistApprove(taskId, item._id, "rejected")}
          className={`  rounded border text-xl ${
            disabled
              ? "cursor-not-allowed text-gray-600 "
              : status === "rejected"
              ? "text-red-600 cursor-pointer"
              : "text-gray-900 hover:text-gray-900 cursor-pointer"
          }`}
        >
          <LuX />
        </button>
      </div>
    );
  };

  return (
    <div>
      {todoList.map((item, index) => (
        <div
          key={item._id || index}
          className={`flex justify-between items-center gap-2 border px-3 py-2 rounded-md mb-3 mt-2
            ${
              item.completed
                ? "bg-green-100 border-green-100"
                : "bg-red-100 border-red-100"
            }`}
        >
          <p className="flex-1 text-sm text-gray-800">
            <span className="text-red-500 font-semibold mr-2">
              {index < 9 ? `0${index + 1}` : index + 1}
            </span>
            {item.text}
          </p>

          <div className="flex items-center gap-4">
            <SelectUsers
              selectedUsers={item.assignedTo || []}
              setSelectedUsers={(newUsers) => {
                const updated = [...todoList];
                updated[index].assignedTo = newUsers;
                setTodoList(updated);
              }}
              role="user"
            />

            {/* Approval controls for admin roles */}
            {item._id && user?.role !== "user" && (
              <div className="flex items-center gap-2">
                {renderApprovalButtons(item)}
              </div>
            )}

            {/* Remove button for superAdmin */}
            {user?.role === "superAdmin" && (
              <button
                className="text-gray-700 hover:text-red-500"
                onClick={() => handleRemoveOption(index)}
                type="button"
              >
                <HiOutlineTrash className="text-2xl" />
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-5 mt-4">
        <input
          type="text"
          placeholder="Enter Task"
          value={option}
          onChange={(e) => setOption(e.target.value)}
          className="w-full text-[13px] text-black bg-white border border-gray-100 px-3 py-2 rounded-md outline-none"
        />
        <button
          type="button"
          onClick={handleAddOption}
          className="card-btn text-nowrap"
        >
          <HiPlus className="text-lg" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};

export default TodoListInput;
