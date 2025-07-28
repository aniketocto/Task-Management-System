import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import React, { useContext, useEffect, useState } from "react";
import {
  SIDE_MENU_ADMIN_DATA,
  SIDE_MENU_BE_USER_DATA,
  SIDE_MENU_SUPER_ADMIN_DATA,
  SIDE_MENU_USER_DATA,
} from "../../utils/data";
import AnalogClock from "./AnalogClock";
import USER_IMG from "../../assets/user_fallback.svg";
import Modal from "./Modal";
import DeleteAlert from "./DeleteAlert";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const [sideMenuData, setSideMenuData] = useState([]);
  const [profileImg, setProfileImg] = useState("");
  const [openLogoutModal, setOpenLogoutModal] = useState(false);

  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === "logout") {
      handleLogout();
      return;
    }

    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem("taskManagerToken");
    localStorage.removeItem("taskTableSortBy");
    localStorage.removeItem("taskTableSortOrder");

    clearUser();
    navigate("/login");
  };

  useEffect(() => {
    if (user) {
      setSideMenuData(
        user?.role === "admin"
          ? SIDE_MENU_ADMIN_DATA
          : user?.role === "superAdmin"
          ? SIDE_MENU_SUPER_ADMIN_DATA
          : user?.department === "BusinessDevelopment"
          ? SIDE_MENU_BE_USER_DATA
          : SIDE_MENU_USER_DATA
      );
      setProfileImg(user?.profileImageUrl);
    }
    return () => {};
  }, [user]);

  return (
    <div className="w-64 h-screen bg-[#06090E] border-r border-gray-500/40 sticky top-[82px] z-20">
      <div className="flex flex-col items-center justify-center mb-7 pt-5">
        <div className="">
          <img
            src={profileImg?.length > 10 ? profileImg : USER_IMG}
            alt="profile"
            className="w-20 h-20 border border-gray-500/40 rounded-full object-contain"
          />
        </div>
        {(user?.role === "admin" || user?.role === "superAdmin") && (
          <div className="text-[10px] font-medium text-white bg-[#E43941] px-3 py-0.5 rounded mt-1">
            {user.role === "admin" ? "Admin" : "SuperAdmin"}
          </div>
        )}

        <h5 className="text-white font-medium leading-6 mt-3">{user?.name}</h5>
        <p className="text-[12px] text-gray-500"> {user?.department || ""} </p>
        <p className="text-[12px] text-gray-500 mb-5"> {user?.email || ""} </p>

        {sideMenuData.map((item, index) => {
          const isLogout = item.path === "logout";

          return (
            <button
              key={`menu_${index}`}
              className={`w-full flex items-center gap-4 text-[15px] ${
                activeMenu === item.label
                  ? "text-[#E43941] bg-linear-to-r from-red-500/20 to-transparent border-r-3"
                  : "text-white"
              } py-3 px-6 mb-3 cursor-pointer`}
              onClick={() => {
                if (isLogout) {
                  setOpenLogoutModal(true);
                } else {
                  handleClick(item.path);
                }
              }}
            >
              <item.icon
                className={`text-xl ${
                  activeMenu === item.label && "text-[#E43941]"
                }`}
              />
              {item.label}
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={openLogoutModal}
        onClose={() => setOpenLogoutModal(false)}
        title="Logout"
      >
        <DeleteAlert
          content="Are you sure sure you want to logout?"
          onDelete={() => handleLogout()}
          title="Logout"
        />
      </Modal>
    </div>
  );
};

export default SideMenu;
