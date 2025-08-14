import React, { useState } from "react";
import { HiPlus, HiOutlineTrash } from "react-icons/hi";
import { LuPaperclip, LuSquareArrowOutUpRight } from "react-icons/lu";

const AddAttachmentInputs = ({ attachments = [], setAttachments }) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  // Normalize to [{name,url}] array in state (support legacy strings in render)
  const add = () => {
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const next = [
      ...attachments,
      {
        name: cleanName || `Attachment ${attachments.length + 1}`,
        url: cleanUrl,
      },
    ];
    setAttachments(next);
    setName("");
    setUrl("");
  };


  const removeAt = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const open = (href) => {
    let link = href || "";
    if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;
    window.open(link, "_blank");
  };

  return (
    <div>
      {/* list */}
      {attachments.map((item, index) => {
        // tolerate legacy string entries
        const isString = typeof item === "string";
        const attName = isString
          ? `Attachment ${index + 1}`
          : item.name || `Attachment ${index + 1}`;
        const attUrl = isString ? item : item.url;

        return (
          <div key={index} className="flex items-center gap-3 mb-2">
            <div className="flex-1 flex items-center justify-between bg-blue-50 border border-blue-100 px-3 py-2 rounded-md">
              <div className="flex items-center gap-3 min-w-0">
                <LuPaperclip className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-black font-medium truncate">
                    {attName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{attUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button type="button" onClick={() => removeAt(index)}>
                  <HiOutlineTrash className="text-lg text-red-500" />
                </button>
              </div>
            </div>

            <button type="button" onClick={() => open(attUrl)} title="Open">
              <LuSquareArrowOutUpRight className="text-blue-400 text-2xl cursor-pointer" />
            </button>
          </div>
        );
      })}

      {/* inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-md px-3">
          <input
            type="text"
            placeholder="File name (e.g., Design Brief)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-[13px] text-black outline-none bg-white py-2"
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-md px-3">
          <input
            type="text"
            placeholder="File link (https://...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-[13px] text-black outline-none bg-white py-2"
          />
        </div>
      </div>

      <div className="mt-2">
        <button type="button" className="card-btn text-nowrap" onClick={add}>
          <HiPlus className="text-lg" /> Add
        </button>
      </div>
    </div>
  );
};

export default AddAttachmentInputs;
