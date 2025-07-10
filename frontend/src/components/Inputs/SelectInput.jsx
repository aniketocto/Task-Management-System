import React from "react";

const SelectInput = ({ value, onChange, label, options }) => {
  return (
    <div>
      <label className="text-[13px] text-slate-50">{label}</label>

      <div className="input-box">
        <select
          value={value}
          onChange={(e) => onChange(e)}
          className="w-full bg-transparent outline-none border-0 focus:border-0 focus:ring-0 text-black"
        >
          <option className="text-gray-500" disabled value="" disabled>Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} className="text-black" value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectInput;
