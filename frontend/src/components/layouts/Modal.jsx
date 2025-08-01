import React from "react";
import { LuCross, LuX } from "react-icons/lu";

const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-[calc(100vh-1rem)] max-h-full overflow-y-auto overflow-x-hidden bg-black/20 bg-opacity-50 backdrop-blur-[1px]">
      <div className="relative w-full max-w-2xl max-h-full">
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-sm">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t  border-gray-900">
            <h3 className="text-lg font-medium text-gray-900 ">{title}</h3>
            <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center" onClick={onClose}>
             <LuX className="size-[50px]" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 md:p-5 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
