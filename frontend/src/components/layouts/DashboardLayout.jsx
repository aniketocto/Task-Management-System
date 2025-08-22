import React, { useContext } from "react";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import { UserContext } from "../../context/userContext";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="h-dvh">
      <Navbar activeMenu={activeMenu} />

      {user && (
        <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
          <div className="max-[1080px]:hidden w-64 border-r border-gray-500/40">
            <SideMenu activeMenu={activeMenu} />
          </div>

          <div className="grow overflow-y-auto overflow-x-hidden px-5 py-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
