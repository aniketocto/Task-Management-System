export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "task_profile_preset"); // your preset name
  data.append("cloud_name", "dmrzxjo3p"); // from Cloudinary dashboard

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dmrzxjo3p/image/upload",
    {
      method: "POST",
      body: data,
    }
  );

  if (!response.ok) throw new Error("Failed to upload image");

  const result = await response.json();
  return result.secure_url;
};
