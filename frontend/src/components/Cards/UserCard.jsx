import { useState } from "react";
import toast from "react-hot-toast";
import { LuTrash } from "react-icons/lu";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import Modal from "../../components/layouts/Modal";
import DeleteAlert from "../../components/layouts/DeleteAlert";

const UserCard = ({ userInfo, onUserDeleted }) => {
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  // Delete Task
  const deleteUser = async () => {
    try {
      const response = await axiosInstance.delete(
        API_PATHS.USERS.DELETE_USER_BY_ID(userInfo._id)
      );

      if (response) {
        setOpenDeleteAlert(false);
        toast.success("User deleted successfully");
        onUserDeleted?.();
      }
    } catch (error) {
      toast.error("Error deleting task. Task not deleted");
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="user-card p-2 cursor-pointer relative">
      <div className="flex items-start flex-col justify-between">
        <div className="flex items-center gap-3">
          <img
            src={userInfo?.profileImageUrl}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 object-contain border-white"
          />

          <div className="">
            <p className="text-sm font-medium text-gray-100">
              {userInfo?.name}
            </p>
            <p className="text-xs text-gray-200">{userInfo?.department}</p>
            <p className="text-xs text-gray-100">{userInfo?.email}</p>
          </div>

          <button
            onClick={() => setOpenDeleteAlert(true)}
            className="absolute top-2 right-2 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer"
          >
            <LuTrash className="text-base" />
          </button>
        </div>

        {userInfo?.role === "admin" ? (
          <div className="grid grid-cols-4 gap-3 border-t border-gray-200 py-3 mt-5">
            <StatCard label="Total" count={userInfo?.totalTask} />
            <StatCard label="New" count={userInfo?.newTask} />
            <StatCard label="InProgress" count={userInfo?.inProgressTask} />
            <StatCard label="Sub Tasks" count={userInfo?.subTotal} />
            <StatCard label="Completed" count={userInfo?.completedTask} />
            <StatCard label="Delayed" count={userInfo?.delayedTask} />
            <StatCard label="Pending" count={userInfo?.pendingTask} />
            <StatCard label="Sub Comp" count={userInfo?.subCompleted} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 border-t border-gray-200 py-3 mt-5">
            <StatCard label="Total" count={userInfo?.subTotal} />
            <StatCard label="New" count={userInfo?.subNew} />
            <StatCard label="InProgress" count={userInfo?.subInProgress} />
            <StatCard label="Completed" count={userInfo?.subCompleted} />
            <StatCard label="Delayed" count={userInfo?.subDelayed} />
            <StatCard label="Pending" count={userInfo?.subPending} />
          </div>
        )}
      </div>
      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Task"
      >
        <DeleteAlert
          content="Are you sure sure you want to delete this user"
          onDelete={() => deleteUser()}
        />
      </Modal>
    </div>
  );
};

export default UserCard;

const StatCard = ({ label, count }) => {
  const getStatusColor = (label) => {
    switch (label) {
      case "New":
        return "text-primary";
      case "InProgress":
        return "text-yellow-500";
      case "Completed":
        return "text-green-500";
      case "Pending":
        return "text-cyan-500";
      case "Delayed":
        return "text-red-500";
      case "working":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-200 px-2.5 py-1 rounded-md ">
      <p
        className={`text-sm md:text-[15px] ${getStatusColor(
          label
        )} font-semibold`}
      >
        {" "}
        {count}
      </p>
      <p className={`text-sm md:text-[14px] ${getStatusColor(label)} `}>
        {label}
      </p>
    </div>
  );
};
