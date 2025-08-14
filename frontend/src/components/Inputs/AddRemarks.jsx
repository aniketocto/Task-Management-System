// components/Inputs/AddRemarks.jsx
import React, { useState } from "react";
import moment from "moment";
import { HiPlus, HiOutlineTrash } from "react-icons/hi";

// tiny tooltip similar to your TodoListInput Tooltip
const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute z-50  mt-2 px-4 py-3 bg-gray-800 text-white text-base rounded-xl shadow-lg border border-gray-100 whitespace-nowrap"
          style={{ minWidth: 240 }}
        >
          {content}
        </div>
      )}
    </span>
  );
};

const AddRemarks = ({ remarks = [], setRemarks }) => {
  const [input, setInput] = useState("");

  const addRemark = () => {
    const val = input.trim();
    if (!val) return;
    // we can push a string; backend will enrich (user/date).
    setRemarks([...(Array.isArray(remarks) ? remarks : []), val]);
    setInput("");
  };

  const removeRemark = (idx) => {
    const next = (Array.isArray(remarks) ? remarks : []).filter(
      (_, i) => i !== idx
    );
    setRemarks(next);
  };

  return (
    <div>
      {/* list */}
      {(Array.isArray(remarks) ? remarks : []).map((r, i) => {
        // support legacy string OR new object
        const isString = typeof r === "string";
        const text = isString ? r : r.text;
        const author = isString
          ? null
          : r.user?.name || r.user?.email || "Unknown";
        const date = isString ? null : r.date;

        return (
          <div
            key={i}
            className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-md px-3 py-2 mb-2"
          >
            <div className="flex-1 text-sm text-gray-800">
              <Tooltip
                content={
                  <div className="flex flex-col gap-1">
                    <div className="text-xs opacity-80">
                      <div>
                        <span className="font-semibold">By:</span>{" "}
                        {author || "—"} at{" "}
                        {date ? moment(date).format("lll") : "—"}
                      </div>
                    </div>
                  </div>
                }
              >
                <span title="Hover to see who & when" className="cursor-pointer">{text}</span>
              </Tooltip>
            </div>

            <button
              type="button"
              className="text-gray-700 hover:text-red-500"
              onClick={() => removeRemark(i)}
              title="Remove remark"
            >
              <HiOutlineTrash className="text-2xl" />
            </button>
          </div>
        );
      })}

      {/* input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add a remark"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full text-[13px] text-black bg-[#ffffffe3] border border-gray-100 px-3 py-2 rounded-md outline-none"
        />
        <button
          type="button"
          className="card-btn text-nowrap"
          onClick={addRemark}
        >
          <HiPlus className="text-lg" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};

export default AddRemarks;
