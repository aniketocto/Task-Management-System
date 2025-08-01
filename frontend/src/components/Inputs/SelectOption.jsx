import React, { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

const SelectOption = ({ options, value, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };
  return (
    <div className="relative w-full mt-2">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full text-sm text-black outline-none bg-white border border-slate-100 px-2.5 py-3 rounded-md flex justify-between items-center ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {value
          ? options.find((opt) => opt.value === value)?.label
          : placeholder}
        <span className="">{isOpen ? <LuChevronUp /> : <LuChevronDown />}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute w-full max-h-[250px] overflow-auto bg-white border-slate-100 rounded-md mt-1 shadow-md">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectOption;
