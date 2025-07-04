import React, { useRef, useState } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

const ProfilePhotoSelector = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleimageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Upload image state
      setImage(file);

      // Generate prview URL frim the image
      const preview = URL.createObjectURL(file);
      setPreviewImage(preview);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewImage(null);
  };

  const onChooseFile = () => {
    inputRef.current.click();
  };

  return (
    <div className="flex justify-center mb-6">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleimageChange}
        className="hidden"
      />

      {!image ? (
        <div className="w-20 h-20 flex items-center justify-center relative rounded-full bg-blue-100/50 cursor-pointer">
          <LuUser className="text-4xl text-primary" />

          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white absolute -bottom-1 -right-1 cursor-pointer"
            onClick={() => onChooseFile()}
            type="button"
          >
            <LuUpload />
          </button>
        </div>
      ) : (
        <div className="relative">
          <img
            src={previewImage}
            alt="Preview"
            className="w-20 h-20 rounded-full object-contain"
          />
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white absolute -bottom-1 -right-1 cursor-pointer"
            onClick={() => handleRemoveImage()}
            type="button"
          >
            <LuTrash />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoSelector;
