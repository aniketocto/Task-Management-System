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
import MultiSelectChips from "components/Inputs/MultiSelectChips";
import { UserContext } from "../../context/userContext";
import {
  addBusinessDays,
  addThousandsSeperator,
  beautify,
  toLocalInputValue,
} from "../../utils/helper";
import moment from "moment";
import SelectUsers from "components/Inputs/SelectUsers";

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
    amount: "",
    assignedTo: null,
  });

  const [currentLead, setCurrentLead] = useState(null);
  // eslint-disable-next-line
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
      services: [],
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
      amount: "",
      assignedTo: null,
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
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance
      .get(API_PATHS.USERS.GET_ALL_USERS)
      .then((res) => setAllUsers(res.data || []))
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingUsers(false));
  }, []);

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
      toast.error(error.response.data.message);
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
          leadCameDate: leadInfo.leadCameDate
            ? toLocalInputValue(leadInfo.leadCameDate).slice(0, 10)
            : "",
          // type="datetime-local":
          credentialDeckDate: toLocalInputValue(leadInfo.credentialDeckDate),
          discoveryCallDate: toLocalInputValue(leadInfo.discoveryCallDate),
          pitchDate: toLocalInputValue(leadInfo.pitchDate),
          attachments: leadInfo.attachments || [],
          remark: leadInfo.remark,
          followUp: leadInfo.followUp || [],
          brief: leadInfo.brief,
          services: Array.isArray(leadInfo.services)
            ? leadInfo.services
            : leadInfo.services
            ? [leadInfo.services]
            : [],
          leadSource: leadInfo.leadSource,
          referral: leadInfo.referral,
          amount: leadInfo.amount,
          assignedTo: leadInfo.assignedTo,
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

  const sameDateInput = (apiISO, inputVal) => {
    if (!apiISO && !inputVal) return true;
    return toLocalInputValue(apiISO) === (inputVal || "");
  };

  const updateLead = async () => {
    setLoading(true);

    try {
      // Clone state so we can safely modify
      const payload = { ...leadData };

      // Remove unchanged datetime fields
      ["credentialDeckDate", "discoveryCallDate", "pitchDate"].forEach((f) => {
        const apiISO = currentLead?.leadInfo?.[f] || null; // original value from API
        if (sameDateInput(apiISO, payload[f])) {
          delete payload[f];
        }
      });

      // Remove unchanged date-only field
      const apiLeadCameDateLocal = currentLead?.leadInfo?.leadCameDate
        ? toLocalInputValue(currentLead.leadInfo.leadCameDate).slice(0, 10)
        : "";
      if (apiLeadCameDateLocal === (payload.leadCameDate || "")) {
        delete payload.leadCameDate;
      }

      const response = await axiosInstance.put(
        API_PATHS.LEADS.UPDATE_LEAD_BY_ID(leadId),
        payload
      );

      if (response.status === 200) {
        toast.success("Lead updated successfully");
        getLead();
        // navigate("/manage-lead");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRequestSubmit = async () => {
    if (newRequestedDate === dateRequestModal.oldDate) {
      toast.error("New date must be different from the current date.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put(API_PATHS.LEADS.UPDATE_LEAD_BY_ID(leadId), {
        [dateRequestModal.field]: newRequestedDate,
        changeReason,
      });
      toast.success("Date change request sent for approval.");
      closeDateRequestModal();
      getLead();
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
                .slice(0, 3)
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
                  Company Name <sup className="text-red-500 text-xs">*</sup>
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
                  Category <sup className="text-red-500 text-xs">*</sup>
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
                  Opportunity Type <sup className="text-red-500 text-xs">*</sup>
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
                <label className="text-xs font-medium text-slate-200 mb-6">
                  Service Type <sup className="text-red-500 text-xs">*</sup>
                </label>

                {/* <SelectOption
                  options={LEAD_SERVICE}
                  value={leadData.services}
                  onChange={(value) => handleValueChange("services", value)}
                  placeholder="Select Services"
                  isMulti
                /> */}
                <MultiSelectChips
                  options={LEAD_SERVICE} // [{label, value}]
                  value={leadData.services || []} // array
                  onChange={(vals) => handleValueChange("services", vals)}
                  placeholder="Select Services"
                />
              </div>

              {/* Status */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  Status <sup className="text-red-500 text-xs">*</sup>
                </label>

                <SelectOption
                  options={OPPO_STATUS}
                  value={leadData.status}
                  onChange={(value) => handleValueChange("status", value)}
                  placeholder="Select status"
                />
              </div>

              {leadData.status === "onboarded" && (
                <div className="">
                  <label className="text-xs font-medium text-slate-200">
                    Amount <sup className="text-red-500 text-xs">*</sup>
                  </label>

                  <input
                    placeholder="Amount Rs."
                    className="form-input"
                    value={`₹ ${addThousandsSeperator(leadData.amount || "")}`}
                    onChange={({ target }) => {
                      // Remove ₹ and commas before saving
                      const cleanValue = target.value.replace(/[₹,\s]/g, "");
                      handleValueChange("amount", cleanValue);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Pocs */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-4">
              {/* POC Name */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  POC Name <sup className="text-red-500 text-xs">*</sup>
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
                  POC Email <sup className="text-red-500 text-xs">*</sup>
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
                  POC Contact <sup className="text-red-500 text-xs">*</sup>
                </label>

                <input
                  type="number"
                  placeholder="POC Contact  "
                  className="form-input"
                  value={leadData.contact}
                  onChange={({ target }) => {
                    handleValueChange("contact", target.value);
                  }}
                  max={10}
                />
              </div>

              {/* Job Profile */}
              <div className="">
                <label className="text-xs font-medium text-slate-200">
                  Job Profile <sup className="text-red-500 text-xs">*</sup>
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
              <div className="col-span-10 ">
                <label className="text-xs font-medium text-slate-200">
                  Brief <sup className="text-red-500 text-xs">*</sup>
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
              <div className=" col-span-2">
                <label className="text-xs font-medium text-slate-200">
                  Assign Owner <sup className="text-red-500 text-xs">*</sup>
                </label>

                <SelectUsers
                  selectedUsers={
                    leadData.assignedTo ? [leadData.assignedTo] : []
                  }
                  setSelectedUsers={(ids) =>
                    handleValueChange(
                      "assignedTo",
                      ids.length > 0 ? ids[0] : null
                    )
                  }
                  allUsers={allUsers}
                  loading={loadingUsers}
                  role="admin"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-12 gap-2 mt-4">
              {/* Lead Came Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Lead Date <sup className="text-red-500 text-xs">*</sup>
                </label>
                <input
                  // disabled={
                  //   leadId &&
                  //   user.role !== "superAdmin" &&
                  //   leadData.leadCameDate < Date.now()
                  // }
                  type="date"
                  className="form-input-date"
                  value={leadData.leadCameDate || ""}
                  onChange={(e) =>
                    handleValueChange("leadCameDate", e.target.value)
                  }
                />
              </div>

              {/* Credential Deck Date */}
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-200">
                  Credential Deck Presentation
                </label>
                <input
                  // disabled={
                  //   leadId &&
                  //   user.role !== "superAdmin" &&
                  //   leadData.credentialDeckDate < Date.now()
                  // }
                  type="datetime-local"
                  className="form-input-date"
                  value={leadData.credentialDeckDate || ""}
                  onChange={(e) =>
                    handleValueChange("credentialDeckDate", e.target.value)
                  }
                  // min={new Date().toISOString().split("T")[0]}
                  // max={addBusinessDays(leadData.leadCameDate, 3)}
                />
                {user.role !== "superAdmin" && leadId && (
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
                  // disabled={
                  //   leadId &&
                  //   user.role !== "superAdmin" &&
                  //   leadData.discoveryCallDate < Date.now()
                  // }
                  type="datetime-local"
                  className="form-input-date"
                  value={leadData.discoveryCallDate || ""}
                  onChange={(e) =>
                    handleValueChange("discoveryCallDate", e.target.value)
                  }
                  // min={new Date().toISOString().split("T")[0]}
                  // max={addBusinessDays(leadData.leadCameDate, 5)}
                />
                {user.role !== "superAdmin" && leadId && (
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
                  // disabled={
                  //   leadId &&
                  //   user.role !== "superAdmin" &&
                  //   new Date(leadData.pitchDate).getTime() < Date.now()
                  // }
                  type="datetime-local"
                  className="form-input-date"
                  value={leadData.pitchDate || ""}
                  onChange={(e) =>
                    handleValueChange("pitchDate", e.target.value)
                  }
                  // min={new Date().toISOString().split("T")[0]}
                  // max={addBusinessDays(leadData.leadCameDate, 7)}
                />
                {user.role !== "superAdmin" && leadId && (
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
                  Lead Source <sup className="text-red-500 text-xs">*</sup>
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
              {leadData.leadSource === "referral" && (
                <div className="">
                  <label className="text-xs font-medium text-slate-200">
                    Referral Name <sup className="text-red-500 text-xs">*</sup>
                  </label>

                  <input
                    placeholder="Name"
                    className="form-input"
                    value={leadData.referral}
                    onChange={({ target }) => {
                      handleValueChange("referral", target.value);
                    }}
                  />
                </div>
              )}
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
          <div className="mb-2 text-sm text-white">
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
