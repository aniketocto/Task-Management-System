import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import React, { useContext, useEffect, useState } from "react";
import {
  SIDE_MENU_ADMIN_DATA,
  SIDE_MENU_BE_USER_DATA,
  SIDE_MENU_SUPER_ADMIN_DATA,
  SIDE_MENU_USER_DATA,
} from "../../utils/data";
import USER_IMG from "../../assets/user_fallback.svg";
import Modal from "./Modal";
import DeleteAlert from "./DeleteAlert";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import axiosInstance from "../../utils/axiosInstance";
import { LuUpload } from "react-icons/lu";
import { API_PATHS } from "../../utils/apiPaths";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import SpinLoader from "./SpinLoader";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const [sideMenuData, setSideMenuData] = useState([]);
  const [profileImg, setProfileImg] = useState("");
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleImageUpload = async () => {
    setLoading(true);
    if (!selectedFile) return;

    try {
      const uploadedUrl = await uploadToCloudinary(selectedFile);
      const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        profileImageUrl: uploadedUrl,
      });

      setProfileImg(uploadedUrl);
      setOpenImageModal(false);
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user?.role === "superAdmin") {
        setSideMenuData(SIDE_MENU_SUPER_ADMIN_DATA);
      } else if (
        user?.role === "admin" &&
        user?.department === "BusinessDevelopment"
      ) {
        setSideMenuData(SIDE_MENU_BE_USER_DATA); // maybe you want BE admin UI
      } else if (user?.role === "admin") {
        setSideMenuData(SIDE_MENU_ADMIN_DATA);
      } else if (user?.department === "BusinessDevelopment") {
        setSideMenuData(SIDE_MENU_BE_USER_DATA);
      } else {
        setSideMenuData(SIDE_MENU_USER_DATA);
      }

      setProfileImg(user?.profileImageUrl);
    }
    return () => {};
  }, [user]);

  return (
    <div className="w-64 h-screen bg-[#06090E] border-r border-gray-500/40 sticky top-[82px] z-20">
      <div className="flex flex-col items-center justify-center mb-7 pt-5">
        <div className="relative">
          <img
            src={profileImg?.length > 10 ? profileImg : USER_IMG}
            alt="profile"
            className="w-20 h-20 border border-gray-500/40 rounded-full object-contain"
          />
          <button
            className="absolute bottom-0 right-0 w-6 h-6 bg-[#E43941] rounded-full flex items-center justify-center text-white text-xs"
            onClick={() => setOpenImageModal(true)}
          >
            <LuUpload />
          </button>
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
      <Modal
        isOpen={openImageModal}
        onClose={() => setOpenImageModal(false)}
        title="Update Profile Picture"
      >
        <ProfilePhotoSelector image={selectedFile} setImage={setSelectedFile} />

        <button
          className="bg-[#E43941] text-white w-full py-2 rounded"
          onClick={handleImageUpload}
        >
          Upload & Save
        </button>
      </Modal>
      {loading && <SpinLoader />}
    </div>
  );
};

export default SideMenu;
