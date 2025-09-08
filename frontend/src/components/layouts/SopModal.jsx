import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import SpinLoader from "./SpinLoader";
import Modal from "./Modal";
import Input from "components/Inputs/Input";
import SelectOption from "components/Inputs/SelectOption";
import SelectUsers from "components/Inputs/SelectUsers";
import { DESIGNATIONS } from "../../utils/data";

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  frequency: "daily",
  designation: "",
  assignedTo: [],
};

const SopModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return; 
    if (editData) {
      setFormData({
        title: editData.title || "",
        description: editData.description || "",
        frequency: editData.frequency || "daily",
        designation: editData.designation || "",
        assignedTo: editData.assignedTo ? [editData.assignedTo._id] : [],
      });
    } else {
      setFormData(INITIAL_FORM); 
    }
  }, [isOpen, editData]);

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance
      .get(API_PATHS.USERS.GET_ALL_USERS)
      .then((res) => setAllUsers(res.data || []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = { ...formData };
      if (payload.designation) payload.assignedTo = null;
      if (payload.assignedTo.length > 0) payload.designation = "";

      if (editData) {
        await axiosInstance.put(
          API_PATHS.SOPS.UPDATE_SOP(editData._id),
          payload
        );
        toast.success("SOP updated");
      } else {
        await axiosInstance.post(API_PATHS.SOPS.CREATE_SOP, payload);
        toast.success("SOP created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving SOP");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <SpinLoader />;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit SOP" : "Add SOP"}
    >
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="Enter SOP title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
        <textarea
          className="form-input"
          rows={3}
          placeholder="Enter SOP description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />
        <SelectOption
          label="Frequency"
          options={FREQUENCY_OPTIONS}
          value={formData.frequency}
          onChange={(val) => handleChange("frequency", val)}
        />

        {/* {formData.assignedTo.length > 0 && (
          <SelectOption
            options={DESIGNATIONS}
            value={formData.designation}
            onChange={(val) => handleChange("designation", val)}
            label="Designation"
            placeholder="Select your designation"
          />
        )} */}

        {formData.designation === "" && (
          <SelectUsers
            selectedUsers={formData.assignedTo}
            setSelectedUsers={(val) => handleChange("assignedTo", val)}
            allUsers={allUsers}
            loading={loadingUsers}
          />
        )}

        <div className="flex justify-end">
          <button onClick={handleSubmit} className="add-btn">
            {editData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SopModal;
