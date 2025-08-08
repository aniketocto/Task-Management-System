import React, { useState } from "react";
import { FaBookmark } from "react-icons/fa";
import { HiPlus } from "react-icons/hi";

const AddRemarks = ({ remarks = [], setRemarks }) => {
  const [option, setOption] = useState("");

  // Function to handle adding an option
  const handleAddOption = () => {
    if (option.trim()) {
      const updatedList = [...remarks, option.trim()];
      setRemarks(updatedList);
      setOption("");
    }
  };

  const handleRemoveOption = (index) => {
    const updatedArr = remarks.filter((_, i) => i !== index);
    setRemarks(updatedArr);
  };

  return (
    <div>
      {remarks.map((item, index) => (
        <div className="flex justify-center items-center gap-4">
          <div
            key={index}
            className="flex flex-1 justify-between bg-blue-50 border border-blue-100 px-3 py-2 rounded-md mb-3 mt-2"
          >
            <p className="flex items-center text-sm text-gray-800">
              <FaBookmark className="text-red-500 mr-2" />
              {item}
            </p>
            <div className="flex items-center gap-3">
              <button
                className="cursor-pointer"
                onClick={() => handleRemoveOption(index)}
              >
                {/* <HiOutlineTrash className="text-lg text-red-500" /> */}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-1 md:gap-5">
        <div className="flex-1 flex items-center gap-3 bg-gray-50  border border-gray-100 rounded-md px-3">
          <input
            type="text"
            placeholder="Add Remarks"
            value={option}
            onChange={(e) => setOption(e.target.value)}
            className="w-full text-[13px] text-black outline-none bg-[#ffffffe3] py-2"
          />
        </div>

        <button className="card-btn text-nowrap" onClick={handleAddOption}>
          <HiPlus className="text-lg" /> Add
        </button>
      </div>
    </div>
  );
};

export default AddRemarks;
