import React from "react";
import { LuX } from "react-icons/lu";

const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-transparent bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      {/* Centered modal */}
      <div
        className="fixed z-50 h-dvh inset-0 flex items-center justify-center p-2 sm:p-0"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="
            bg-gray-900 rounded-xl shadow-lg w-full max-w-md sm:max-w-lg
            mx-2
            overflow-y-auto max-h-[90vh]
            border border-gray-700
          "
          style={{ pointerEvents: "auto" }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 rounded-t">
            <h3 className="text-lg font-medium text-gray-100">{title}</h3>
            <button
              type="button"
              className="text-gray-100 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
              onClick={onClose}
            >
              <LuX className="text-2xl" />
            </button>
          </div>
          {/* Modal Body */}
          <div className="p-4 space-y-4">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Modal;
