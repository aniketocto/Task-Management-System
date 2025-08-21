import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import moment from "moment";
import { FiCalendar } from "react-icons/fi";
import SpinLoader from "./SpinLoader";
import toast from "react-hot-toast";
import AvatarGroup from "./AvatarGroup";
import SelectUsers from "components/Inputs/SelectUsers";

const LeadReportTable = () => {
  const [rows, setRows] = useState([]);
  const [selectMonth, setSelectMonth] = useState(moment().format("YYYY-MM"));
  const [editMode, setEditMode] = useState(false);
  const [draftRows, setDraftRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const leadSources = [
    { label: "Cold Calling", key: "coldCalling" },
    { label: "LinkedIn Outreach", key: "linkedInOutreach" },
    { label: "Events / Expos", key: "events" },
    { label: "Referrals", key: "referral" },
    { label: "WhatsApp Marketing", key: "whatsAppMarketing" },
    { label: "Email Marketing", key: "emailMarketing" },
    { label: "Meta Ads", key: "metaAds" },
    { label: "Google Ads", key: "googleAds" },
    { label: "Social Media", key: "socialMedia" },
    { label: "Website", key: "website" },
    { label: "Just Dial", key: "justDial" },
    { label: "India Mart", key: "indiaMart" },
    { label: "Fiverr", key: "fiverr" },
  ];

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const { data } = await axiosInstance.get(
          API_PATHS.LEADREPORT.GET_CHANNEL_ROWS,
          {
            params: { month: selectMonth },
          }
        );
        setRows(data.rows || []);
      } catch (err) {
        console.error("Error fetching channel rows:", err);
      }
    };
    fetchRows();
  }, [selectMonth]);

  const handleDraftChange = (leadSource, field, value) => {
    setDraftRows((prev) =>
      prev.map((r) =>
        r.leadSource === leadSource ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      await Promise.all(
        draftRows.map((row) =>
          axiosInstance.put(
            `${API_PATHS.LEADREPORT.UPDATE_CHANNEL_ROWS}?month=${selectMonth}`,
            row
          )
        )
      );
      // ✅ Fetch fresh data with populated owner immediately
      const { data } = await axiosInstance.get(
        API_PATHS.LEADREPORT.GET_CHANNEL_ROWS,
        { params: { month: selectMonth } }
      );
      setRows(data.rows || []);
      setEditMode(false);
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const merged = leadSources.map((src) => {
    return (
      rows.find((r) => r.leadSource === src.key) || { leadSource: src.key }
    );
  });

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

  useEffect(() => {
    if (editMode) {
      setDraftRows(merged);
    }
  }, [editMode]);

  if (loading) {
    return <SpinLoader />;
  }

  return (
    <div className="card my-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 justify-center">
          <h5 className="font-medium">Activity & Channel Breakdown</h5>
          {editMode ? (
            <button
              onClick={handleSaveAll}
              className="w-fit flex items-center justify-center gap-1.5 text-sm font-medium text-[#39e464] whitespace-nowrap bg-green-50 border border-green-100 rounded-lg px-4 py-2 cursor-pointer"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="w-fit! add-btn"
            >
              Edit
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Select Month:</label>
          <div className="relative w-fit">
            <input
              type="month"
              value={selectMonth}
              onChange={(e) => setSelectMonth(e.target.value)}
              className="text-white bg-gray-800 border border-gray-600 px-3 py-2 rounded pl-10 focus:outline-none"
            />
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-sm pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto p-0 rounded-lg mt-3">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="py-3 px-4 text-white bg-red-400 border-b border-gray-500 font-semibold text-[13px] sticky top-0">
                Lead Source
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Activities Planned
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Frequency
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Owner
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Target Leads
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Actual Leads
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Budget Allocation
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Expected Conversions
              </th>
              <th className="py-3 px-4 text-white bg-red-400 font-semibold border-b border-gray-500 text-[13px] sticky top-0">
                Actual Conversions
              </th>
            </tr>
          </thead>
          <tbody>
            {leadSources.map((source, idx) => (
              <tr key={idx} className="text-left">
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {source.label}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="text"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.activitiesPlanned || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "activitiesPlanned",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].activitiesPlanned || "-"
                  )}
                </td>

                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="text"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.frequency || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "frequency",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].frequency || "-"
                  )}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <SelectUsers
                      selectedUsers={
                        merged[idx].owner
                          ? [
                              typeof merged[idx].owner === "object"
                                ? merged[idx].owner
                                : { _id: merged[idx].owner },
                            ]
                          : []
                      }
                      setSelectedUsers={(ids) =>
                        handleDraftChange(
                          source.key,
                          "owner",
                          ids.length > 0 ? ids[0] : null
                        )
                      }
                      allUsers={allUsers}
                      loading={loadingUsers}
                      role="admin"
                    />
                  ) : (
                    <AvatarGroup
                      avatars={
                        merged[idx].owner
                          ? [
                              {
                                name: merged[idx].owner.name,
                                profileImageUrl:
                                  merged[idx].owner.profileImageUrl,
                              },
                            ]
                          : []
                      }
                      maxVisible={1}
                    />
                  )}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="number"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.targetLeads || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "targetLeads",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].targetLeads || "-"
                  )}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="number"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.actualLeads || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "actualLeads",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].actualLeads || "-"
                  )}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="number"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.budgetAllocation || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "budgetAllocation",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].budgetAllocation || "-"
                  )}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="number"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.expectedConversions || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "expectedConversions",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].expectedConversions || "-"
                  )}
                </td>
                <td className="py-3 px-4 text-white text-[13px] border-b border-gray-500">
                  {editMode ? (
                    <input
                      type="number"
                      className="bg-transparent border-b border-gray-600 w-full text-white text-sm"
                      value={draftRows[idx]?.actualConversions || ""}
                      onChange={(e) =>
                        handleDraftChange(
                          source.key,
                          "actualConversions",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    merged[idx].actualConversions || "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadReportTable;
