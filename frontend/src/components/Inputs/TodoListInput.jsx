import React, { useContext, useEffect, useState } from "react";
import { HiOutlineTrash, HiPlus } from "react-icons/hi";
import { LuCheck, LuX } from "react-icons/lu";
import SelectUsers from "./SelectUsers";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { CiMemoPad } from "react-icons/ci";

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

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance
      .get(API_PATHS.USERS.GET_ALL_USERS)
      .then((res) => setAllUsers(res.data || []))
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleAddOption = () => {
    if (!option.trim()) return;
    setTodoList([
      ...todoList,
      {
        text: option,
        completed: false,
        assignedTo: [],
        completionLogs: [], // <-- add this
        approvalLogs: [], // <-- add this
        approval: { status: "pending" }, // also safe to add this default
      },
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
          {editIndex === index ? (
            <input
              className="flex-1 text-sm text-black border border-gray-200 px-2 py-1 rounded"
              value={editText}
              autoFocus
              onChange={(e) => setEditText(e.target.value)}
              onBlur={() => {
                const updated = [...todoList];
                updated[index].text = editText;
                setTodoList(updated);
                setEditIndex(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const updated = [...todoList];
                  updated[index].text = editText;
                  setTodoList(updated);
                  setEditIndex(null);
                }
                if (e.key === "Escape") {
                  setEditIndex(null);
                }
              }}
            />
          ) : (
            <span className="flex-1 text-sm text-gray-800 flex items-center">
              <span className="text-red-500 font-semibold mr-2">
                {index < 9 ? `0${index + 1}` : index + 1}
              </span>
              {item.text}

              {/* Edit Button for SuperAdmin */}
              {user?.role === "superAdmin" && (
                <button
                  className="ml-2 text-blue-500 hover:text-blue-700 text-xs cursor-pointer"
                  onClick={() => {
                    setEditIndex(index);
                    setEditText(item.text);
                  }}
                  type="button"
                  title="Edit"
                >
                  ✏️
                </button>
              )}
            </span>
          )}

          <div className="flex items-center gap-4">
            {/* Completion Log Tooltip (🕑) */}
            <div className="flex items-center">
              <Tooltip
                content={
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold text-base mb-1">
                      Completion Log
                    </div>
                    {Array.isArray(item.completionLogs) &&
                    item.completionLogs.length > 0 ? (
                      item.completionLogs
                        .slice()
                        .reverse()
                        .map((log, idx) => {
                          const u = allUsers.find(
                            (usr) => usr._id === log.user
                          );
                          return (
                            <div
                              key={idx}
                              className="border-b border-gray-700 pb-1 mb-1 last:border-b-0 last:mb-0"
                            >
                              <span className="font-semibold">
                                {u ? u.name : "Unknown"}
                              </span>
                              {" marked as completed "}
                              <br />
                              <span className="text-xs opacity-70">
                                {moment(log.date).format("lll")}
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <span className="text-gray-300">Not completed yet</span>
                    )}
                  </div>
                }
              >
                {item.completionLogs.length > 0 && (
                  <span title="Show completion log" tabIndex={0}>
                    <IoCheckmarkDoneCircle className="text-green-400 text-3xl cursor-pointer" />
                  </span>
                )}
              </Tooltip>

              {/* Approval Log Tooltip (📋) */}
              <Tooltip
                content={
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold text-base mb-1">
                      Approval Log
                    </div>
                    {Array.isArray(item.approvalLogs) &&
                    item.approvalLogs.length > 0 ? (
                      item.approvalLogs
                        .slice()
                        .reverse()
                        .map((log, idx) => {
                          const admin = allUsers.find(
                            (u) => u._id === log.admin
                          );
                          return (
                            <div
                              key={idx}
                              className="border-b border-gray-700 pb-1 mb-1 last:border-b-0 last:mb-0"
                            >
                              <span className="capitalize font-medium">
                                {log.status}
                              </span>
                              {" by "}
                              <span className="font-semibold">
                                {admin ? admin.name : "Unknown"}
                              </span>
                              <br />
                              <span className="text-xs opacity-70">
                                {moment(log.date).format("lll")}
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <span className="text-gray-300">No approvals yet</span>
                    )}
                  </div>
                }
              >
                <span title="Show approval log" tabIndex={0}>
                  <CiMemoPad className="text-gray-400 text-3xl cursor-pointer" />
                </span>
              </Tooltip>
            </div>

            <SelectUsers
              selectedUsers={item.assignedTo || []}
              setSelectedUsers={(newUsers) => {
                const updated = [...todoList];
                updated[index].assignedTo = newUsers;
                setTodoList(updated);
              }}
              allUsers={allUsers}
              loading={loadingUsers}
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

      <div className="flex items-center gap-5 ">
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

const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-4 py-3 bg-gray-800 text-white text-base rounded-xl shadow-lg border border-gray-100 whitespace-nowrap"
          style={{ minWidth: 240 }}
        >
          {content}
        </div>
      )}
    </span>
  );
};
