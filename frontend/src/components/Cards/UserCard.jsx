import React from "react";
import { useNavigate } from "react-router-dom";

const UserCard = ({ userInfo }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    // navigate(`/admin/dashboard?userId=${userInfo._id}`);
  };

  return (
    <div className="user-card p-2 cursor-pointer" onClick={handleClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={userInfo?.profileImageUrl}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 object-contain border-white"
          />

          <div className="">
            <p className="text-sm font-medium">{userInfo?.name}</p>
            <p className="text-xs text-gray-500">{userInfo?.department}</p>
            <p className="text-xs text-gray-500">{userInfo?.email}</p>
          </div>
        </div>
      </div>
      <div className=""></div>
    </div>
  );
};

export default UserCard;
