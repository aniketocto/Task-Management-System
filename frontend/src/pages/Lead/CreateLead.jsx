import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import CategorySelect from "../../components/Inputs/CategorySelect";
import { OPPO_STATUS, OPPO_Type } from "../../utils/data";
import SelectOption from "../../components/Inputs/SelectOption";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";

const CreateLead = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { leadId } = location.state || {};
  const navigate = useNavigate();
  const [leadData, setLeadData] = useState({
    cName: "",
    email: "",
    jobProfile: "",
    companyName: "",
    status: "",
    type: "",
    category: "",
    leadCameDate: null,
    credentialDeckDate: null,
    discoveryCallDate: null,
    pitchDate: null,
    attachments: {
      briefUrl: "",
      presentationUrl: "",
      agreementUrl: "",
      invoiceUrl: "",
      websiteUrl: "",
    },
    remarks: "",
    followUp: {
      attempt1: false,
      attempt2: false,
      attempt3: false,
      attempt4: false,
      attempt5: false,
    },
  });

  const [currentLead, setCurrentLead] = useState(null);
  const [error, setError] = useState([]);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [createdBy, setCreatedBy] = useState(false);

  const handleValueChange = (key, value) => {
    setLeadData((prevData) => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    setLeadData({
      cName: "",
      email: "",
      jobProfile: "",
      companyName: "",
      status: "",
      type: "",
      category: "",
      leadCameDate: null,
      credentialDeckDate: null,
      discoveryCallDate: null,
      pitchDate: null,
      attachments: {
        briefUrl: "",
        presentationUrl: "",
        agreementUrl: "",
        invoiceUrl: "",
        websiteUrl: "",
      },
      remarks: "",
      followUp: {
        attempt1: false,
        attempt2: false,
        attempt3: false,
        attempt4: false,
        attempt5: false,
      },
    });
  };

  const handleAttachmentChange = (field, value) => {
    setLeadData((prev) => ({
      ...prev,
      attachments: {
        ...prev.attachments,
        [field]: value,
      },
    }));
  };

  const createLead = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.post(
        API_PATHS.LEADS.CREATE_LEAD,
        leadData
      );

      if (response.status === 200) {
        toast.success("Lead created successfully");
        clearData();
        navigate("/manage-lead");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLead = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.LEADS.GET_LEAD_BY_ID(leadId)
      );
      if (response.data) {
        const leadInfo = response.data;
        setCurrentLead({ leadInfo });
        setLeadData((prevData) => ({
          ...prevData,
          cName: leadInfo.cName,
          email: leadInfo.email,
          jobProfile: leadInfo.jobProfile,
          companyName: leadInfo.companyName,
          status: leadInfo.status,
          type: leadInfo.type,
          category: leadInfo.category,
          leadCameDate: leadInfo.leadCameDate,
          credentialDeckDate: leadInfo.credentialDeckDate,
          discoveryCallDate: leadInfo.discoveryCallDate,
          pitchDate: leadInfo.pitchDate,
          attachments: leadInfo.attachments || [],
          remarks: leadInfo.remarks,
          followUp: leadInfo.followUp || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching lead:", error);
    }
  };

  const updateLead = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.put(
        API_PATHS.LEADS.UPDATE_LEAD_BY_ID(leadId),
        leadData
      );
      if (response.status === 200) {
        toast.success("Lead updated successfully");
        clearData();
        navigate("/manage-lead");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError([]);

    if (leadId) {
      updateLead();
    }

    createLead();
  };

  useEffect(() => {
    clearData();
    if (leadId) {
      getLead();
    }
  }, [leadId]);

  return (
    <DashboardLayout activeMenu="Create Leads">
      <div className="mt-5">
        <div className="grid grid-cols-1 md:col-auto mt-4">
          <div className="form-card col-span-3">
            <h2 className="text-xl md:text-2xl text-white font-semibold">
              Comapny Details
            </h2>

            <div className="grid grid-cols-12 gap-2 mt-4">
              {/* Company Name */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Company Name
                </label>

                <input
                  placeholder="Company Name"
                  className="form-input"
                  value={leadData.companyName}
                  onChange={({ target }) => {
                    handleValueChange("companyName", target.value);
                  }}
                />
              </div>

              {/* Contact Name */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Contact Name
                </label>

                <input
                  placeholder="Contact Name"
                  className="form-input"
                  value={leadData.cName}
                  onChange={({ target }) => {
                    handleValueChange("cName", target.value);
                  }}
                />
              </div>

              {/* Contact Email */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Contact Email
                </label>

                <input
                  placeholder="Contact Email"
                  className="form-input"
                  value={leadData.email}
                  onChange={({ target }) => {
                    handleValueChange("email", target.value);
                  }}
                />
              </div>

              {/* Job Profile */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Job Profile
                </label>

                <input
                  placeholder="Job Profile"
                  className="form-input"
                  value={leadData.jobProfile}
                  onChange={({ target }) => {
                    handleValueChange("jobProfile", target.value);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 mt-4">
              {/* Category */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-200">
                  Category
                </label>

                <CategorySelect
                  value={leadData.category}
                  onChange={(newCategory) =>
                    handleValueChange("category", newCategory)
                  }
                />
              </div>

              {/* Type */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-200">
                  Opportunity Type
                </label>

                <SelectOption
                  options={OPPO_Type}
                  value={leadData.type}
                  onChange={(value) => handleValueChange("type", value)}
                  placeholder="Select Type"
                />
              </div>

              {/* Status */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs font-medium text-slate-200">
                  Status
                </label>

                <SelectOption
                  options={OPPO_STATUS}
                  value={leadData.status}
                  onChange={(value) => handleValueChange("status", value)}
                  placeholder="Select status"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 mt-4">
              {/* Lead Came Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Lead Came Date
                </label>
                <input
                  type="date"
                  className="form-input-date"
                  value={leadData.leadCameDate?.split("T")[0] ?? ""}
                  onChange={({ target }) =>
                    handleValueChange("leadCameDate", target.value)
                  }
                />
              </div>

              {/* Credential Deck Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Credential Deck Date
                </label>
                <input
                  type="date"
                  className="form-input-date"
                  value={leadData.credentialDeckDate?.split("T")[0] ?? ""}
                  onChange={({ target }) =>
                    handleValueChange("credentialDeckDate", target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Discovery Call Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Discovery Call Date
                </label>
                <input
                  type="date"
                  className="form-input-date"
                  value={leadData.discoveryCallDate?.split("T")[0] ?? ""}
                  onChange={({ target }) =>
                    handleValueChange("discoveryCallDate", target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Pitch Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Pitch Date
                </label>
                <input
                  type="datetime-local"
                  className="form-input-date"
                  value={
                    leadData.pitchDate ? leadData.pitchDate.slice(0, 16) : ""
                  }
                  onChange={({ target }) =>
                    handleValueChange("pitchDate", target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-4">
              {[
                { key: "websiteUrl", label: "Website URL" },
                { key: "briefUrl", label: "Brief URL" },
                { key: "presentationUrl", label: "Presentation URL" },
                { key: "agreementUrl", label: "Agreement URL" },
                { key: "invoiceUrl", label: "Invoice URL" },
              ].map(({ key, label }) => (
                <div key={key} className="col-span-1">
                  <label className="text-xs font-medium text-slate-200">
                    {label}
                  </label>
                  <input
                    type="text"
                    className="form-input-date"
                    value={leadData.attachments?.[key] ?? ""}
                    onChange={({ target }) =>
                      handleAttachmentChange(key, target.value)
                    }
                    placeholder={`Enter ${label}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-2 mt-4">
              <div className="col-span-12 ">
                <label className="text-xs font-medium text-slate-200">
                  Remarks
                </label>
                <textarea
                  className="form-input"
                  value={leadData.remarks}
                  onChange={({ target }) =>
                    handleValueChange("remarks", target.value)
                  }
                  placeholder="Enter remarks"
                />
              </div>
            </div>

            <div className="flex justify-end mt-7">
              <button
                className="add-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateLead;
