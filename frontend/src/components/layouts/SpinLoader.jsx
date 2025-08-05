import React from "react";
import { SyncLoader } from "react-spinners";

const SpinLoader = () => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-50 flex flex-col items-center justify-center">
      <SyncLoader color="#e43941" loading={true} size={20} />
      <p className="text-white mt-4 text-lg font-medium">Loading...</p>
    </div>
  );
};

export default SpinLoader;
