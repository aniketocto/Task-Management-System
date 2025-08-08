import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MENU_DATA } from "../../utils/data";
import Modal from "./Modal";
import DeleteAlert from "./DeleteAlert";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import axiosInstance from "../../utils/axiosInstance";
import { LuChevronDown, LuChevronUp, LuUpload } from "react-icons/lu";
import { API_PATHS } from "../../utils/apiPaths";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import SpinLoader from "./SpinLoader";
import Input from "components/Inputs/Input";
import toast from "react-hot-toast";
import moment from "moment";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser, updateUser } = useContext(UserContext);
  const [profileImg, setProfileImg] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(user.profileImageUrl);
  const [loading, setLoading] = useState(false);

  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);

  const navigate = useNavigate();
  const [todayAttendance, setTodayAttendance] = useState(null);

  // Function to calculate elapsed time from check-in
  const calculateElapsedTime = (checkInTime) => {
    if (!checkInTime) return 0;
    const now = moment();
    const checkIn = moment(checkInTime);
    return now.diff(checkIn); // Returns difference in milliseconds
  };

  // Initialize timer based on attendance data
  const initializeTimer = useCallback(() => {
    if (
      todayAttendance?.attendance?.checkIn &&
      !todayAttendance?.attendance?.checkOut
    ) {
      const elapsedTime = calculateElapsedTime(
        todayAttendance.attendance.checkIn
      );
      setTime(elapsedTime);
      setIsActive(true);
      localStorage.setItem(
        "timerState",
        JSON.stringify({
          isActive: true,
          checkInTime: todayAttendance.attendance.checkIn,
        })
      );
    } else {
      setIsActive(false);
      setTime(0);
      localStorage.removeItem("timerState");
    }
  }, [todayAttendance]);

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem("timerState");
    if (savedTimerState) {
      try {
        const { isActive: savedIsActive, checkInTime } =
          JSON.parse(savedTimerState);
        if (savedIsActive && checkInTime) {
          const elapsedTime = calculateElapsedTime(checkInTime);
          setTime(elapsedTime);
          setIsActive(true);
        }
      } catch (error) {
        console.error("Error parsing saved timer state:", error);
        localStorage.removeItem("timerState");
      }
    }
  }, []);

  // Update timer every second when active
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        const savedTimerState = localStorage.getItem("timerState");
        if (savedTimerState) {
          try {
            const { checkInTime } = JSON.parse(savedTimerState);
            const elapsedTime = calculateElapsedTime(checkInTime);
            setTime(elapsedTime);
          } catch (error) {
            console.error("Error updating timer:", error);
          }
        }
      }, 1000); // Update every second instead of every 10ms for better performance
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  // Initialize timer when attendance data is fetched
  useEffect(() => {
    if (todayAttendance) {
      initializeTimer();
    }
  }, [todayAttendance, initializeTimer]);

  const fetchTodayAttendence = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        API_PATHS.ATTENDANCE.GET_TODAY_ATTENDANCE
      );
      setTodayAttendance(res.data);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = MENU_DATA.map((section) => {
    const visibleChildren = section.children.filter((item) =>
      item.access({ role: user?.role, department: user?.department })
    );
    if (!visibleChildren.length) return null;
    return { ...section, children: visibleChildren };
  }).filter(Boolean);

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
    localStorage.removeItem("lastPage");
    localStorage.removeItem("timerState"); // Clear timer state on logout

    clearUser();
    navigate("/login");
  };

  const handleImageUpload = async () => {
    setLoading(true);

    try {
      let updates = {};

      if (selectedFile && typeof selectedFile !== "string") {
        const uploadedUrl = await uploadToCloudinary(selectedFile);
        if (uploadedUrl !== user.profileImageUrl) {
          updates.profileImageUrl = uploadedUrl;
        }
      }

      if (name && name !== user.name) {
        updates.name = name;
      }

      if (designation && designation !== user.designation) {
        updates.designation = designation;
      }

      if (Object.keys(updates).length === 0) {
        setOpenImageModal(false);
        setLoading(false);
        return;
      }

      const res = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        updates
      );

      if (res.status === 200) {
        if (updates.profileImageUrl) setProfileImg(updates.profileImageUrl);
        updateUser(res.data);
        setOpenImageModal(false);
      }
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  const initialOpenSection = filteredMenu.findIndex((section) =>
    section.children.some((item) => item.label === activeMenu)
  );

  const [openSection, setOpenSection] = useState(
    initialOpenSection !== -1 ? initialOpenSection : null
  );

  useEffect(() => {
    fetchTodayAttendence();

    if (initialOpenSection !== openSection) {
      setOpenSection(initialOpenSection);
    }
    // eslint-disable-next-line
  }, [activeMenu]);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const { coords } = await getLocation();

      const res = await axiosInstance.post(API_PATHS.ATTENDANCE.CHECK_IN, {
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });

      if (res.status === 200) {
        const checkInTime = moment().toISOString();
        setIsActive(true);
        setTime(0);

        // Store timer state in localStorage
        localStorage.setItem(
          "timerState",
          JSON.stringify({
            isActive: true,
            checkInTime: checkInTime,
          })
        );

        toast.success("Successfully clocked in at " + moment().format("LT"));
        fetchTodayAttendence();
      }
    } catch (error) {
      toast.error("Failed to clock in");
      console.error(error?.response?.data?.message || "Clock-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const { coords } = await getLocation();
      const res = await axiosInstance.post(API_PATHS.ATTENDANCE.CHECK_OUT, {
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });

      if (res.status === 200) {
        fetchTodayAttendence();
        setIsActive(false);

        localStorage.removeItem("timerState");

        toast.success("Successfully clocked out at " + moment().format("LT"));
      }
    } catch (error) {
      toast.error("Failed to clock out");
      console.error("Error clocking out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format time for display (hours:minutes:seconds)
  const formatTime = (timeInMs) => {
    const hours = Math.floor(timeInMs / 3600000);
    const minutes = Math.floor((timeInMs % 3600000) / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);

    return {
      hours: ("0" + hours).slice(-2),
      minutes: ("0" + minutes).slice(-2),
      seconds: ("0" + seconds).slice(-2),
    };
  };

  const formattedTime = formatTime(time);

  return (
    <>
      <div className="w-64 h-screen bg-[#06090E] border-r border-gray-500/40 sticky top-[82px] z-20">
        <div className="flex flex-col items-center justify-center mb-4 pt-5">
          <div className="relative">
            <img
              src={user?.profileImageUrl || profileImg}
              alt="profile"
              className="w-20 h-20 border border-gray-500/40 rounded-full object-contain"
            />
            <button
              className="absolute bottom-0 right-0 w-6 h-6 bg-[#E43941] rounded-full flex items-center justify-center text-white text-xs"
              onClick={() => {
                setSelectedFile(user?.profileImageUrl || "");
                setName(user?.name || "");
                setDesignation(user?.designation || "");
                setOpenImageModal(true);
              }}
            >
              <LuUpload />
            </button>
          </div>

          {(user?.role === "admin" || user?.role === "superAdmin") && (
            <div className="text-[10px] font-medium text-white bg-[#E43941] px-3 py-0.5 rounded mt-1">
              {user.role === "admin" ? "Admin" : "SuperAdmin"}
            </div>
          )}

          <p className="text-white text-sm font-regular mt-3 ">
            {user?.designation}
          </p>
          <p className="text-white text-xs font-light ">{user?.name}</p>
          <p className="text-[10px] text-gray-500">
            {" "}
            {user?.department || ""}{" "}
          </p>
          <p className="text-[10px] text-gray-500"> {user?.email || ""} </p>
        </div>

        {todayAttendance && user?.role !== "superAdmin" && (
          <div className="flex flex-col items-center justify-center mb-2">
            <button
              className="button-30"
              onClick={
                todayAttendance?.attendance?.checkIn &&
                !todayAttendance?.attendance?.checkOut
                  ? handleClockOut
                  : handleClockIn
              }
            >
              {todayAttendance?.attendance?.checkIn &&
              !todayAttendance?.attendance?.checkOut
                ? "🕒 Clock Out"
                : "🕒 Clock In"}
            </button>
          </div>
        )}

        <div className="timer">
          <span className="digits">{formattedTime.hours}.</span>
          <span className="digits">{formattedTime.minutes}.</span>
          <span className="digits mili-sec">{formattedTime.seconds}</span>
        </div>

        {filteredMenu.map((section, idx) => (
          <div key={section.label} className="mb-[1px]">
            <button
              className="flex items-center justify-between w-full px-6 py-2 text-white text-lg font-regular bg-[#1a1d23] hover:bg-[#22252b] transition"
              onClick={() => setOpenSection(openSection === idx ? null : idx)}
            >
              <span>{section.label}</span>
              <span>
                {openSection === idx ? <LuChevronUp /> : <LuChevronDown />}
              </span>
            </button>
            {openSection === idx && (
              <div className="flex flex-col mt-1">
                {section.children.map((item) => (
                  <button
                    key={item.label + item.path}
                    className={`flex items-center gap-4 text-[15px] py-3 px-8 mb-1 text-left  hover:bg-[#E43941]/20 transition
  ${
    activeMenu === item.label
      ? "text-[#E43941] font-bold bg-gradient-to-r from-[#E43941]/20 to-[#ffffff00]"
      : "text-white"
  }
`}
                    onClick={() => {
                      if (item.path === "logout") {
                        setOpenLogoutModal(true);
                      } else {
                        handleClick(item.path);
                      }
                    }}
                  >
                    <item.icon className="text-xl" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && <SpinLoader />}
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
        title="Update Profile"
      >
        <ProfilePhotoSelector image={selectedFile} setImage={setSelectedFile} />

        <Input
          value={name || user.name}
          onChange={(e) => setName(e.target.value)}
          label="Name"
          placeholder="Enter your name"
          type="text"
        />
        <Input
          value={designation || user.designation}
          onChange={(e) => setDesignation(e.target.value)}
          label="Designation"
          placeholder="Enter your designation"
          type="text"
        />

        <button
          className="bg-[#E43941] text-white w-full py-2 rounded"
          onClick={handleImageUpload}
        >
          Upload & Save
        </button>
      </Modal>
    </>
  );
};

export default SideMenu;
