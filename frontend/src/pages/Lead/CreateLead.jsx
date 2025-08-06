import { useCallback, useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  LEAD_SERVICE,
  LEAD_SOURCE,
  LEAD_TYPE,
  OPPO_STATUS,
  OPPO_TYPE,
} from "../../utils/data";
import SelectOption from "../../components/Inputs/SelectOption";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { useLocation, useNavigate } from "react-router-dom";
import { LuTrash } from "react-icons/lu";
import Modal from "components/layouts/Modal";
import DeleteAlert from "components/layouts/DeleteAlert";
import { UserContext } from "../../context/userContext";
import { addBusinessDays, beautify } from "../../utils/helper";
import moment from "moment";

const CreateLead = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { leadId } = location.state || {};
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [leadData, setLeadData] = useState({
    cName: "",
    email: "",
    jobProfile: "",
    companyName: "",
    contact: "",
    socials: {
      instagramUrl: "",
      linkedinUrl: "",
    },
    leadSource: "",
    referral: "",
    status: "",
    type: "",
    category: "",
    services: "",
    brief: "",
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
    remark: "",
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
  const [newRequestedDate, setNewRequestedDate] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [createdBy, setCreatedBy] = useState(null);

  const [dateRequestModal, setDateRequestModal] = useState({
    open: false,
    field: "",
    oldDate: null,
  });

  function openDateRequestModal(field, oldDate) {
    setDateRequestModal({ open: true, field, oldDate });
  }
  function closeDateRequestModal() {
    setDateRequestModal({ open: false, field: "", oldDate: null });
  }

  const handleValueChange = (key, value) => {
    setLeadData((prevData) => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    setLeadData({
      cName: "",
      email: "",
      jobProfile: "",
      companyName: "",
      contact: "",
      socials: {
        instagramUrl: "",
        linkedinUrl: "",
      },
      leadSource: "",
      referral: "",
      status: "",
      type: "",
      category: "",
      services: "",
      brief: "",
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
      remark: "",
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

  const handlesocialsChange = (key, value) => {
    setLeadData((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [key]: value,
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

      if (response) {
        clearData();
        toast.success("Lead created successfully");
        navigate("/manage-lead");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.LEADS.GET_LEAD_BY_ID(leadId)
      );
      // console.log(response.data);
      if (response.data) {
        const leadInfo = response.data;
        setCurrentLead({ leadInfo });
        setLeadData((prevData) => ({
          ...prevData,
          cName: leadInfo.cName,
          email: leadInfo.email,
          jobProfile: leadInfo.jobProfile,
          companyName: leadInfo.companyName,
          contact: leadInfo.contact,
          socials: leadInfo.socials || [],
          status: leadInfo.status,
          type: leadInfo.type,
          category: leadInfo.category,
          leadCameDate: leadInfo.leadCameDate || null,
          credentialDeckDate: leadInfo.credentialDeckDate || null,
          discoveryCallDate: leadInfo.discoveryCallDate || null,
          pitchDate: leadInfo.pitchDate || null,
          attachments: leadInfo.attachments || [],
          remark: leadInfo.remark,
          followUp: leadInfo.followUp || [],
          brief: leadInfo.brief,
          services: leadInfo.services,
          leadSource: leadInfo.leadSource,
        }));

        leadInfo?.dateChangeRequests?.map((request) =>
          getUserbyId(request.requestedBy)
        );
      }
    } catch (error) {
      console.error("Error fetching lead:", error);
    } finally {
      setLoading(false);
    }
  }, [leadId, setCurrentLead, setLeadData]);
  const getUserbyId = async (userId) => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.USERS.GET_USER_BY_ID(userId)
      );
      const user = response.data;
      setCreatedBy(user?.name);
    } catch (error) {
      console.error("Error fetching users:", error);
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
        // getLead();
        // navigate("/manage-lead");
      }
      console.log(response.data);
    } catch (error) {
      console.error("Error updating lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRequestSubmit = async () => {
    setLoading(true);
    try {
      await axiosInstance.put(API_PATHS.LEADS.UPDATE_LEAD_BY_ID(leadId), {
        [dateRequestModal.field]: newRequestedDate,
        changeReason, // backend may or may not use this
      });
      toast.success("Date change request sent for approval.");
      closeDateRequestModal();
      getLead(); // reload data
    } catch (err) {
      console.error(err);
      toast.error("Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateDecision = async (requestId, decision) => {
    setLoading(true);
    try {
      await axiosInstance.patch(
        API_PATHS.DUE_DATE.DECIDE_DATE_CHANGE_REQUEST(leadId, requestId), // make sure this path matches your API config
        { decision }
      );
      toast.success(`Date change ${decision}d.`);
      getLead(); // reload to get latest status
    } catch (err) {
      console.error(err);
      toast.error("Failed to update request.");
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = () => {
    try {
      setLoading(true);
      const response = axiosInstance.delete(
        API_PATHS.LEADS.DELETE_LEAD_BY_ID(leadId)
      );
      if (response) {
        setOpenDeleteAlert(false);
        toast.success("Lead deleted successfully");
        navigate("/manage-lead");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError([]);

    if (leadId) {
      updateLead();
      return;
    }

    createLead();
  };

  useEffect(() => {
    clearData();
    if (leadId) {
      getLead();
    }
  }, [leadId, getLead]);

  return (
    <DashboardLayout activeMenu="Create Leads">
      <div className="mt-5">
        {currentLead?.leadInfo?.dateChangeRequests &&
          Array.isArray(currentLead?.leadInfo?.dateChangeRequests) && (
            <div className="bg-gray-800 rounded-md p-4 my-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Date Change Requests
              </h3>
              {currentLead.leadInfo.dateChangeRequests
                .filter((r) => r.status === "pending")
                .map((request) => (
                  <div
                    key={request._id}
                    className="border-b border-gray-700 py-2 flex flex-col md:flex-row md:items-end md:justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Field:</b> {beautify(request.field)}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Old Date:</b>{" "}
                        {moment(request.oldDate).format("DD-MM-YYYY hh:mm A")}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>New Date:</b>{" "}
                        {moment(request.newDate).format("DD-MM-YYYY hh:mm A")}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Requested By:</b> {createdBy} At{" "}
                        {moment(request.requestedAt).format(
                          "DD-MM-YYYY hh:mm A"
                        )}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Reason :</b> {request.reason || "No reason provided"}
                      </div>
                    </div>
                    {user.role === "superAdmin" && (
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                          onClick={() =>
                            handleDateDecision(request._id, "approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() =>
                            handleDateDecision(request._id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              {currentLead.leadInfo.dateChangeRequests
                .filter((r) => r.status !== "pending")
                .map((request) => (
                  <div
                    key={request._id}
                    className="border-b border-gray-700 py-2 flex flex-col md:flex-row md:items-end md:justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Field:</b> {beautify(request.field)}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Old Date:</b>{" "}
                        {moment(request.oldDate).format("DD-MM-YYYY hh:mm A")}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>New Date:</b>{" "}
                        {moment(request.newDate).format("DD-MM-YYYY hh:mm A")}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Requested By:</b> {createdBy} At{" "}
                        {moment(request.requestedAt).format(
                          "DD-MM-YYYY hh:mm A"
                        )}
                      </div>
                      <div className="text-sm font-light text-gray-100">
                        <b>Reason :</b> {request.reason || "No reason provided"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

        <div className="grid grid-cols-1 md:col-auto mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl text-white font-semibold">
                Comapny Details
              </h2>

              {leadId && (
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer"
                  onClick={() => setOpenDeleteAlert(true)}
                >
                  <LuTrash className="text-base" /> Delete
                </button>
              )}
            </div>

            {/* Statuses */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4">
              {/* Company Name */}
              <div className="">
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

              {/* Category */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  Category
                </label>
                <SelectOption
                  options={LEAD_TYPE}
                  value={leadData.category}
                  onChange={(value) => handleValueChange("category", value)}
                  placeholder="Select Category"
                />
              </div>

              {/* Type */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  Opportunity Type
                </label>

                <SelectOption
                  options={OPPO_TYPE}
                  value={leadData.type}
                  onChange={(value) => handleValueChange("type", value)}
                  placeholder="Select Type"
                />
              </div>

              {/* Service */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  Service Type
                </label>

                <SelectOption
                  options={LEAD_SERVICE}
                  value={leadData.services}
                  onChange={(value) => handleValueChange("services", value)}
                  placeholder="Select Services"
                />
              </div>

              {/* Status */}
              <div className="">
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

            {/* Pocs */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-4">
              {/* POC Name */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  POC Name
                </label>

                <input
                  placeholder="POC Name"
                  className="form-input"
                  value={leadData.cName}
                  onChange={({ target }) => {
                    handleValueChange("cName", target.value);
                  }}
                />
              </div>

              {/* POC Email */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  POC Email
                </label>

                <input
                  placeholder="POC Email"
                  className="form-input"
                  value={leadData.email}
                  onChange={({ target }) => {
                    handleValueChange("email", target.value);
                  }}
                />
              </div>

              {/* POC Contact */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  POC Contact
                </label>

                <input
                  placeholder="POC Contact  "
                  className="form-input"
                  value={leadData.contact}
                  onChange={({ target }) => {
                    handleValueChange("contact", target.value);
                  }}
                />
              </div>

              {/* Job Profile */}
              <div className="">
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

              {/* socials */}
              {[
                { key: "instagramUrl", label: "Instagram" },
                { key: "linkedinUrl", label: "Linkedin" },
              ].map(({ key, label }) => (
                <div key={key} className="">
                  <label className="text-xs font-medium text-slate-200">
                    {label}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={leadData.socials?.[key] ?? ""}
                    onChange={({ target }) =>
                      handlesocialsChange(key, target.value)
                    }
                    placeholder={`Enter ${label}`}
                  />
                </div>
              ))}
            </div>

            {/* Brief */}
            <div className="grid grid-cols-12 gap-2 mt-4">
              <div className="col-span-12 ">
                <label className="text-xs font-medium text-slate-200">
                  Brief
                </label>
                <textarea
                  className="form-input"
                  value={leadData.brief}
                  onChange={({ target }) =>
                    handleValueChange("brief", target.value)
                  }
                  placeholder="Enter brief"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-12 gap-2 mt-4">
              {/* Lead Came Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Lead Date
                </label>
                <input
                  disabled={
                    leadId &&
                    user.role !== "superAdmin" &&
                    leadData.leadCameDate
                  }
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
                  Credential Deck Presentation
                </label>
                <input
                  disabled={
                    leadId &&
                    user.role !== "superAdmin" &&
                    leadData.credentialDeckDate
                  }
                  type="datetime-local"
                  className="form-input-date"
                  value={
                    leadData.credentialDeckDate
                      ? leadData.credentialDeckDate.slice(0, 16)
                      : ""
                  }
                  onChange={({ target }) =>
                    handleValueChange("credentialDeckDate", target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  max={addBusinessDays(leadData.leadCameDate, 2)}
                />
                {user.role !== "superAdmin" && (
                  <button
                    className="ml-2 text-red-500 cursor-pointer text-xs"
                    onClick={() =>
                      openDateRequestModal(
                        "credentialDeckDate",
                        leadData.credentialDeckDate
                      )
                    }
                    type="button"
                  >
                    Request Change
                  </button>
                )}
              </div>

              {/* Discovery Call Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Discovery Call Presentation
                </label>
                <input
                  disabled={
                    leadId &&
                    user.role !== "superAdmin" &&
                    leadData.discoveryCallDate
                  }
                  type="datetime-local"
                  className="form-input-date"
                  value={
                    leadData.discoveryCallDate
                      ? leadData.discoveryCallDate.slice(0, 16)
                      : ""
                  }
                  onChange={({ target }) =>
                    handleValueChange("discoveryCallDate", target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  max={addBusinessDays(leadData.leadCameDate, 4)}
                />
                {user.role !== "superAdmin" && (
                  <button
                    className="ml-2 text-red-500 cursor-pointer text-xs"
                    onClick={() =>
                      openDateRequestModal(
                        "discoveryCallDate",
                        leadData.discoveryCallDate
                      )
                    }
                    type="button"
                  >
                    Request Change
                  </button>
                )}
              </div>

              {/* Pitch Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Pitch Presentation
                </label>
                <input
                  disabled={
                    leadId &&
                    user.role !== "superAdmin" &&
                    new Date(leadData.pitchDate).getTime() < Date.now()
                  }
                  type="datetime-local"
                  className="form-input-date"
                  value={
                    leadData.pitchDate ? leadData.pitchDate.slice(0, 16) : ""
                  }
                  onChange={({ target }) =>
                    handleValueChange("pitchDate", target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  max={addBusinessDays(leadData.leadCameDate, 6)}
                />
                {user.role !== "superAdmin" && (
                  <button
                    className="ml-2 text-red-500 cursor-pointer text-xs"
                    onClick={() =>
                      openDateRequestModal("pitchDate", leadData.pitchDate)
                    }
                    type="button"
                  >
                    Request Change
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 mt-4">
              {/* leadsource */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  Lead Source
                </label>

                <SelectOption
                  options={LEAD_SOURCE}
                  value={leadData.leadSource}
                  onChange={(value) => handleValueChange("leadSource", value)}
                  placeholder="Lead Source"
                />
              </div>

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
                  Remark
                </label>
                <textarea
                  className="form-input"
                  value={leadData.remark}
                  onChange={({ target }) =>
                    handleValueChange("remark", target.value)
                  }
                  placeholder="Enter remark"
                />
              </div>
            </div>

            <div className="flex justify-end mt-7">
              <button
                className="add-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {leadId ? "Update Lead" : "Create Lead"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Lead"
      >
        <DeleteAlert
          content="Are you sure you want to delete this lead?"
          onDelete={() => deleteLead()}
        />
      </Modal>

      <Modal
        isOpen={dateRequestModal.open}
        onClose={closeDateRequestModal}
        title="Request Date Change"
      >
        <div>
          <div className="mb-2 text-sm">
            Current Date:{" "}
            <b>
              {dateRequestModal.oldDate
                ? moment(dateRequestModal.oldDate).format("DD-MM-YYYY hh:mm A")
                : "-"}
            </b>
          </div>
          <label className="block text-xs font-medium text-slate-200 mb-1">
            New Date
          </label>
          <input
            type="datetime-local"
            className="form-input"
            value={newRequestedDate}
            onChange={(e) => setNewRequestedDate(e.target.value)}
          />
          <label className="block mt-2 text-xs font-medium text-slate-200 mb-1">
            Reason for Change
          </label>
          <textarea
            className="form-input"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <button
              className="add-btn"
              onClick={handleDateRequestSubmit}
              disabled={!newRequestedDate}
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default CreateLead;
