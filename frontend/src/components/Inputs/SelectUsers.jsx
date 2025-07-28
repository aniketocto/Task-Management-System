import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { LuUser } from "react-icons/lu";
import Modal from "../../components/layouts/Modal";
import AvatarGroup from "../../components/layouts/AvatarGroup";
import { SyncLoader } from "react-spinners";

const SelectUsers = ({ selectedUsers, setSelectedUsers, role }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  console.log(selectedUsers);

  const getAllUser = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);

      if (response.data?.length > 0) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setTempSelectedUsers((prev) => {
      const ids = prev.map((u) => (typeof u === "string" ? u : u._id));
      return ids.includes(userId)
        ? prev.filter((u) => (typeof u === "string" ? u : u._id) !== userId)
        : [...prev, userId];
    });
  };

  const handleAssign = () => {
    setSelectedUsers(tempSelectedUsers); // ✅ just array of IDs
    setIsModalOpen(false);
  };

  const selectedUserAvatars = selectedUsers.map((user) => ({
    name: user.name,
    profileImageUrl: user.profileImageUrl,
  }));

  useEffect(() => {
    getAllUser();
  }, []);

  useEffect(() => {
    if (selectedUsers.length === 0) {
      setTempSelectedUsers([]);
    }

    return () => {};
  }, [selectedUsers]);

  useEffect(() => {
    if (isModalOpen) {
      setTempSelectedUsers(selectedUsers);
    }
  }, [isModalOpen, selectedUsers]);

  return (
    <div className="space-y-4 mt-2">
      {loading && (
        <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/5 flex flex-col items-center justify-center">
          <SyncLoader color="#e43941" loading={true} size={20} />
          <p className="text-white mt-4 text- lg font-medium">Loading...</p>
        </div>
      )}
      {selectedUserAvatars.length === 0 && (
        <button className="card-btn" onClick={() => setIsModalOpen(true)}>
          <LuUser className="text-sm" /> Add Members
        </button>
      )}

      {selectedUserAvatars.length > 0 && (
        <div className=" cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <AvatarGroup avatars={selectedUserAvatars} maxVisible={3} />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Members"
      >
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-3 p-2 text-sm border border-gray-300 rounded"
        />
        <div className="sapce-y-4 h-[60vh] overflow-y-auto">
          {allUsers
            .filter((user) => {
              if (role === "admin") return user.role === "admin";
              return true;
            })
            .filter((user) =>
              user.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-3 border-b border-gray-200 cursor-pointer"
                onClick={() => toggleUserSelection(user._id)}
              >
                <img
                  src={user.profileImageUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-contain"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-[13px] text-gray-600">{user.department}</p>
                </div>

                <input
                  type="checkbox"
                  checked={tempSelectedUsers.includes(user._id)}
                  readOnly
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none"
                  onClick={(e) => e.stopPropagation()} // optional: if you still want to prevent bubbling
                />
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button className="card-btn" onClick={() => setIsModalOpen(false)}>
            CANCEL
          </button>
          <button className="card-btn-fill" onClick={handleAssign}>
            DONE
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SelectUsers;
