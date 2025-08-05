import { useState } from "react";

const InfoCard = ({ label, value, color, description }) => {
  const formattedValue = String(label).replace(/([a-z])([A-Z])/g, "$1-$2");

  return (
    <Tooltip content={description}>
      <div className="flex items-center gap-3 cursor-pointer">
        <div className={`w-2 md:w-2 h-3 md:h-5 ${color} rounded-full`}></div>
        <p className="text-sm md:text-[14px] text-gray-500">
          <span className="text-sm md:text-[15px] text-white font-semibold">
            {value}
          </span>{" "}
          {formattedValue}
        </p>
      </div>
    </Tooltip>
  );
};

export default InfoCard;

const Tooltip = ({ content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      tabIndex={0}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      style={{ outline: "none" }}
    >
      {children}
      {show && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-lg border border-gray-800 whitespace-nowrap"
          style={{ minWidth: 200 }}
        >
          {content}
        </div>
      )}
    </span>
  );
};
