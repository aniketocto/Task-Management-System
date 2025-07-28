import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "components/layouts/DashboardLayout";
import AvatarGroup from "components/layouts/AvatarGroup";
import moment from "moment";
import { LuSquareArrowOutUpRight } from "react-icons/lu";
import toast from "react-hot-toast";

const ViewTaskDetails = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [createdBy, setCreatedBy] = useState(false);

  const getStatusTagColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-[#3956E4] border border-blue-200";
      case "inProgress":
        return "bg-yellow-100 text-[#E48E39] border border-yellow-200";
      case "completed":
        return "bg-green-100 text-[#6FE439] border border-green-200";
      case "pending":
        return "bg-cyan-100 text-[#39C5E4] border border-cyan-200";
      case "delayed":
        return "bg-red-100 text-[#E43941] border border-red-200";
      case "All":
        return "bg-purple-100 text-[#B439E4] border border-purple-200";
      
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  //get Task info by ID
  const getTaskDetailsByID = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(id)
      );
      if (response.data) {
        const taskInfo = response.data?.task;
        setTask(taskInfo);
        getUserbyId(taskInfo?.createdBy);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

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

  const setTaskToWorking = async () => {
    try {
      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_STATUS(id),
        { status: "inProgress" }
      );
      if (response.status === 200) {
        toast.success("Task marked as Working");
        getTaskDetailsByID(); // Refresh task
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Update status error:", error);
    }
  };

  // handle todo check
  const updateTodoChecklist = async (index) => {
    const todoChecklist = [...(task?.todoChecklist || [])];
    const taskId = id;

    if (todoChecklist && todoChecklist[index]) {
      todoChecklist[index].completed = !todoChecklist[index].completed;

      try {
        const response = await axiosInstance.put(
          API_PATHS.TASKS.UPDATE_TASK_CHECKLIST(taskId),
          { todoChecklist }
        );

        if (response.status === 200) {
          setTask(response.data?.task || task);
        } else {
          //Optionally revert the toggle if the API call false.
          todoChecklist[index].completed = !todoChecklist[index].completed;
        }
      } catch (error) {
        toast.error(error.message);
        console.error("Error updating todo checklist:", error);
      }
    }
  };

  //handle attachment link
  const handleLinkClick = (link) => {
    if (!/^https?:\/\//i.test(link)) {
      link = "https://" + link; // Default to HTTPS
    }
    window.open(link, "_blank");
  };

  useEffect(() => {
    if (id) {
      getTaskDetailsByID();
    }
    return () => {};
  }, [id]);

  return (
    // This line Shows the left side dashboard on the Task-details page
    <DashboardLayout activeMenu="My Tasks">
      <div className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-2xl text-slate-50 font-medium">
                  {task?.companyName}
                </h2>

                <p className="text-white text-xs font-regular">
                  Created By: {createdBy}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {task?.status === "new" && (
                  <button
                    className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                    onClick={setTaskToWorking}
                  >
                    Set to Working
                  </button>
                )}

                <div
                  className={`text-[11px] md:text-[13px] font-medium ${getStatusTagColor(
                    task?.status
                  )} px-3 py-1 rounded`}
                >
                  {task?.status}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <InfoBox label="Title" value={task?.title} />
            </div>
            <div className="mt-4">
              <InfoBox label="Description" value={task?.description} />
            </div>
            <div className="grid grid-cols-12 gap-4 mt-4">
              <div className="col-span-6 md:col-span-4">
                <InfoBox label="Priority" value={task?.priority} />
              </div>
              {/* </div> */}
              <div className="col-span-6 md:col-span-4">
                <InfoBox
                  label="Due Date"
                  value={
                    task?.dueDate
                      ? moment(task?.dueDate).format("Do MMM YYYY")
                      : "N/A"
                  }
                />
              </div>

              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-500">
                  Assigned To
                </label>

                <AvatarGroup
                  avatars={
                    task?.assignedTo?.map((u) => ({
                      name: u.name,
                      profileImageUrl: u.profileImageUrl,
                    })) || []
                  }
                  maxVisible={3}
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="text-xs font-medium text-slate-500">
                Todo Checklist
              </label>

              {task?.todoChecklist?.map((item, index) => (
                <TodoCheckList
                  key={`todo_${index}`}
                  text={item.text}
                  isChecked={item?.completed}
                  onChange={() => updateTodoChecklist(index)}
                  assignedTo={item?.assignedTo}
                />
              ))}
            </div>

            {task?.attachments?.length > 0 && (
              <div className="mt-2">
                <label className="text-xs font-medium text-slate-500">
                  Attachments
                </label>

                {task?.attachments?.map((link, index) => (
                  <Attachment
                    key={`link_${index}`}
                    link={link}
                    index={index}
                    onClick={() => handleLinkClick(link)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewTaskDetails;

const InfoBox = ({ label, value }) => {
  return (
    <>
      <label className="text-xs font-medium text-slate-50">{label}</label>
      <p className="text-[12px] md:text-[15px] capitalize font-medium text-gray-50 mt-0.5">
        {value}
      </p>
    </>
  );
};

const TodoCheckList = ({ text, isChecked, onChange, assignedTo = [] }) => {
  return (
    <div className="flex items-center justify-between border px-3 py-2 rounded-md mb-3 mt-2 border-gray-100 gap-2">
      <div className="flex justify-center items-center gap-2">
        <input
          type="checkbox"
          name="taskCheck"
          checked={isChecked}
          onChange={onChange}
          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer"
        />
        <label htmlFor="taskCheck" className="text-[15px] text-gray-50">
          {text}
        </label>
      </div>
      <AvatarGroup
        avatars={
          assignedTo?.map((user) => ({
            name: user?.name,
            profileImageUrl: user?.profileImageUrl,
          })) || []
        }
        maxVisible={3}
      />
    </div>
  );
};

const Attachment = ({ link, index, onClick }) => {
  return (
    <div
      className="flex justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs text-gray-400 font-semibold mr-2">
          {index < 9 ? `0${index + 1}` : index + 1}
        </span>
        <p className="text-xs text-black">{link}</p>
      </div>

      <LuSquareArrowOutUpRight className="text-gray-400" />
    </div>
  );
};
