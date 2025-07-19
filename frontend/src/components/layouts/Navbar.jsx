import React, { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";
import NotificationBell from "./NotificationBell ";
import LOGO from "../../assets/logo-png.png";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  return (
    <div className="flex gap-5 items-center justify-between bg-[#06090E] border-b-2 border-gray-200 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-50">
      <button
        className="block lg:hidden text-white"
        onClick={() => {
          setOpenSideMenu(!openSideMenu);
        }}
      >
        {openSideMenu ? (
          <HiOutlineX className="text-2xl text-white" />
        ) : (
          <HiOutlineMenu className="text-2xl text-white" />
        )}
      </button>

      <img src={LOGO} alt="Unstoppable" className="w-40" />

      <NotificationBell />

      {openSideMenu && (
        <div className="fixed top-[61px] -ml-4 bg-white">
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;
