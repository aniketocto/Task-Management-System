import React from "react";

const SelectInput = ({ value, onChange, label, options }) => {
  return (
    <div>
      <label className="text-[13px] text-slate-800">{label}</label>

      <div className="input-box">
        <select
          value={value}
          onChange={(e) => onChange(e)}
          className="w-full bg-transparent outline-none border-0 focus:border-0 focus:ring-0 text-slate-800"
        >
          <option value="" disabled>Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectInput;
