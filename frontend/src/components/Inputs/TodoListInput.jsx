import React, { useState } from "react";
import { HiOutlineTrash, HiPlus } from "react-icons/hi";
import SelectUsers from "./SelectUsers";

const TodoListInput = ({ todoList = [], setTodoList }) => {
  const [option, setOption] = useState("");

  //   function to handle adding an option
  const handleAddOption = () => {
    if (option.trim()) {
      const updatedList = [
        ...todoList,
        {
          text: option,
          completed: false,
          assignedTo: null,
        },
      ];

      setTodoList(updatedList);
      setOption("");
    }
  };

  //   function to handle removing option
  const handleRemoveOption = (index) => {
    const updatedArr = todoList.filter((_, i) => i !== index);
    setTodoList(updatedArr);
  };

  return (
    <div>
      {todoList.map((item, index) => (
        <div
          key={index}
          className={`flex justify-between gap-2 
      ${
        item.completed
          ? "bg-green-100 border-green-100"
          : "bg-red-100 border-red-100"
      } 
      border px-3 py-2 rounded-md mb-3 mt-2`}
        >
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-800">
              <span className="text-sm text-red-500 font-semibold mr-2">
                {index < 9 ? `0${index + 1}` : index + 1}
              </span>
              <span>{item?.text}</span>
            </p>
          </div>

          {/* 👇 Add select user & avatar for this checklist item */}
          <div>
            <SelectUsers
              selectedUsers={item.assignedTo ? [item.assignedTo] : []}
              setSelectedUsers={(newUserIdArr) => {
                const updated = [...todoList];
                updated[index].assignedTo = newUserIdArr[0]; // single user
                setTodoList(updated);
              }}
            />
          </div>
          {/* <button
            className="text-lg text-red-500 cursor-pointer"
            onClick={() => handleRemoveOption(index)}
            type="button"
          >
            <HiOutlineTrash className="text-lg" />
          </button> */}
        </div>
      ))}

      <div className="flex items-center gap-5">
        <input
          type="text"
          placeholder="Enter Task"
          value={option}
          onChange={(e) => setOption(e.target.value)}
          className="w-full text-[13px] text-black outline-none bg-white border border-gray-100 px-3 py-2 rounded-md"
        />
        <button
          type="button"
          onClick={handleAddOption}
          className="card-btn text-nowrap"
        >
          <HiPlus className="text-lg" /> Add
        </button>
      </div>
    </div>
  );
};

export default TodoListInput;
