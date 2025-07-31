import React, { useState } from "react";
import { HiPlus, HiOutlineTrash } from "react-icons/hi";
import { LuPaperclip, LuSquareArrowOutUpRight } from "react-icons/lu";

const AddReference = ({ referance = [], setReference }) => {
  const [option, setOption] = useState("");

  // Function to handle adding an option
  const handleAddOption = () => {
    if (option.trim()) {
      const updatedList = [...referance, option.trim()];
      setReference(updatedList);
      setOption("");
    }
  };

  const handleRemoveOption = (index) => {
    const updatedArr = referance.filter((_, i) => i !== index);
    setReference(updatedArr);
  };

  return (
    <div>
      {referance.map((item, index) => (
        <div className="flex justify-center items-center gap-4">
          <div
            key={index}
            className="flex flex-1 justify-between bg-blue-50 border border-blue-100 px-3 py-2 rounded-md mb-3 mt-2"
          >
            <div className="flex-1 flex items-center gap-3">
              <LuPaperclip className="text-gray-400" />
              <p className="text-sm text-black break-all">{item}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="cursor-pointer"
                onClick={() => handleRemoveOption(index)}
              >
                <HiOutlineTrash className="text-lg text-red-500" />
              </button>
            </div>
          </div>
          <button className="" onClick={() => window.open(item, "_blank")}>
            <LuSquareArrowOutUpRight className="text-blue-400 text-2xl cursor-pointer" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-5">
        <div className="flex-1 flex items-center gap-3 bg-gray-50  border border-gray-100 rounded-md px-3">
          <LuPaperclip className="text-gray-400" />

          <input
            type="text"
            placeholder="Add Refrence"
            value={option}
            onChange={(e) => setOption(e.target.value)}
            className="w-full text-[13px] text-black outline-none bg-white py-2"
          />
        </div>

        <button className="card-btn text-nowrap" onClick={handleAddOption}>
          <HiPlus className="text-lg" /> Add
        </button>
      </div>
    </div>
  );
};

export default AddReference;
