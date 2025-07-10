import React, { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";
import { IoMdNotifications } from "react-icons/io";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  return (
    <div className="flex gap-5 items-center justify-between bg-[#06090E] border-b-2 border-gray-200 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30">
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

      <h2 className="text-lg font-medium text-white">Task Tracker</h2>
      <IoMdNotifications className="text-2xl text-white"/>

      {openSideMenu && (
        <div className="fixed top-[61px] -ml-4 bg-white">
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;
