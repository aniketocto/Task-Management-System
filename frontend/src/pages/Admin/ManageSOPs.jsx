import React, { useEffect, useState, useRef, useCallback } from "react";
import DashboardLayout from "components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import Modal from "components/layouts/Modal";
import DeleteAlert from "components/layouts/DeleteAlert";
import SopModal from "components/layouts/SopModal";
import { beautify } from "../../utils/helper";
import moment from "moment";

const ManageSOPs = () => {
  const [sops, setSops] = useState([]);
  const [freqCounts, setFreqCounts] = useState({});
  const [loading, setLoading] = useState(false);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // Delete states
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [frequencyFilter, setFrequencyFilter] = useState("");

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState(() =>
    moment().format("YYYY-MM-DD")
  );
  const [completions, setCompletions] = useState([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);

  // === User filter (persist like ManageTask) ===
  const hydrated = useRef(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(
    () => sessionStorage.getItem("lastSopUser") || ""
  );
  useEffect(() => {
    sessionStorage.setItem("lastSopUser", selectedUserId || "");
  }, [selectedUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const users = (res.data || [])
        .map((u) => ({ _id: u._id, name: u.name, department: u.department }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableUsers(users);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users");
    }
  }, []);

  // === Fetch SOPs w/ optional user filter ===
  const fetchSops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.SOPS.GET_SOPS, {
        params: {
          assignedTo: selectedUserId || undefined,
          frequency: frequencyFilter || undefined, // already correct
        },
      });
      setSops(res.data?.data || []);
      setFreqCounts(res.data?.counts || {});
    } catch {
      toast.error("Failed to fetch SOPs");
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, frequencyFilter]);

  const fetchCompletions = useCallback(async () => {
    if (!selectedUserId) {
      toast.error("Select a user first");
      return;
    }

    setLoadingCompletions(true);
    try {
      const res = await axiosInstance.get(API_PATHS.SOPS.GET_COMPLETIONS, {
        params: {
          userId: selectedUserId,
          date: completionDate,
        },
      });

      let data = res.data?.data || [];

      data = data.map((item) => {
        const freq = (item.sop && item.sop.frequency) || "";
        return {
          ...item,
          sop: {
            ...item.sop,
            frequency: freq ? String(freq).toLowerCase() : "",
          },
        };
      });
      const activeFilter = (frequencyFilter || "all").toLowerCase();

      const filtered =
        activeFilter === "all" || activeFilter === ""
          ? data
          : data.filter((item) => (item.sop.frequency || "") === activeFilter);

      setCompletions(filtered);
      setCompletionModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch completions", err);
      toast.error("Failed to load completions");
    } finally {
      setLoadingCompletions(false);
    }
  }, [selectedUserId, completionDate, frequencyFilter]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditData(null); // ✅ ensure next open = "Add" mode
  };

  // hydrate guard
  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  console.log(freqCounts)

  return (
    <DashboardLayout activeMenu="Manage SOPs">
      {/* Header + Filters */}
      <div className="card flex items-center justify-between my-6">
        <h2 className="text-2xl font-semibold">
          Manage SOPs
          {selectedUserId && (
            <span className="ml-2 text-sm text-gray-400">
              For {availableUsers.find((u) => u._id === selectedUserId)?.name}
            </span>
          )}
        </h2>

        <div className="flex items-center gap-3">
          {/* User Filter */}
          <div className="flex gap-1 flex-col">
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
              }}
              className="border rounded px-3 py-2 text-sm text-white "
            >
              <option value="" className="text-black">
                All
              </option>
              {availableUsers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((u) => (
                  <option key={u._id} value={u._id} className="text-black">
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Date selector for completions */}
          <input
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm text-white bg-gray-500"
            title="Pick date to check completion for the period containing this date"
          />

          {/* Show completions */}
          <button
            onClick={fetchCompletions}
            disabled={loadingCompletions}
            className="px-3 py-2 rounded-md text-sm bg-gray-700 hover:bg-gray-600 cursor-pointer"
            // title="Show which SOPs were completed by the selected user for this date's period"
          >
            {loadingCompletions ? "Loading..." : "Show Completions"}
          </button>

          {/* Add SOP button (unchanged) */}
          <button
            onClick={() => {
              setEditData(null); // reset for new SOP
              setOpenModal(true);
            }}
            className="add-btn w-fit!"
          >
            + Add SOP
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFrequencyFilter("")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-shadow focus:outline-none cursor-pointer ${
            frequencyFilter === ""
              ? "bg-[#E43941] text-white shadow"
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <span>All</span>
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${
              frequencyFilter === "" ? "bg-white/10" : "bg-white/5"
            }`}
          >
            {freqCounts.all}
          </span>
        </button>

        <button
          onClick={() => setFrequencyFilter("daily")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-shadow focus:outline-none cursor-pointer ${
            frequencyFilter === "daily"
              ? "bg-[#E43941] text-white shadow"
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <span>Daily</span>
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${
              frequencyFilter === "daily" ? "bg-white/10" : "bg-white/5"
            }`}
          >
            {freqCounts.daily}
          </span>
        </button>

        <button
          onClick={() => setFrequencyFilter("weekly")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-shadow focus:outline-none cursor-pointer ${
            frequencyFilter === "weekly"
              ? "bg-[#E43941] text-white shadow"
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <span>Weekly</span>
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${
              frequencyFilter === "weekly" ? "bg-white/10" : "bg-white/5"
            }`}
          >
            {freqCounts.weekly}
          </span>
        </button>

        <button
          onClick={() => setFrequencyFilter("monthly")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-shadow focus:outline-none cursor-pointer ${
            frequencyFilter === "monthly"
              ? "bg-[#E43941] text-white shadow"
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <span>Monthly</span>
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${
              frequencyFilter === "monthly" ? "bg-white/10" : "bg-white/5"
            }`}
          >
            {freqCounts.monthly}
          </span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sops.map((sop) => (
            <div
              key={sop._id}
              className="bg-gray-800 p-4 rounded-xl shadow-md flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold mb-1 text-white">
                  {sop.title}
                </h3>
                <p className="text-sm text-gray-400 mb-2">{sop.description}</p>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full capitalize">
                  {sop.frequency}
                </span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-300">
                    {/* getSOPs populates assignedTo.name server-side */}
                    {sop.designation || sop.assignedTo?.name || "—"}
                  </span>
                  <span className="text-sm text-gray-300">
                    {beautify(sop.assignedTo?.designation) || "—"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="add-btn w-fit!"
                    onClick={() => {
                      setEditData(sop);
                      setOpenModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 cursor-pointer text-sm bg-[#E43941] rounded-md"
                    onClick={() => {
                      setDeleteId(sop._id);
                      setOpenDeleteAlert(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sops.length === 0 && !loading && (
            <p className="col-span-full text-center text-gray-500">
              No SOPs found for this filter.
            </p>
          )}
        </div>
      )}

      {/* ---------------- Completions Modal ---------------- */}
      <Modal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title={`Completions for ${
          availableUsers.find((u) => u._id === selectedUserId)?.name || "user"
        }  ${
          frequencyFilter && frequencyFilter !== "all"
            ? ` ${frequencyFilter}`
            : ""
        }`}
      >
        <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
          {loadingCompletions ? (
            <p className="text-gray-400">Loading...</p>
          ) : completions.length === 0 ? (
            <p className="text-gray-400">
              {frequencyFilter && frequencyFilter !== "all"
                ? `No ${frequencyFilter} SOP completions found for this user `
                : "No SOPs found for this selection."}
            </p>
          ) : (
            completions.map((item, idx) => {
              // each item shape from backend: { user: {...}, sop: { id, title, frequency }, status: "completed"|"pending", completedAt }
              const { sop, status, completedAt } = item;
              return (
                <div
                  key={sop.id + "-" + idx}
                  className="p-3 bg-gray-800 rounded-md flex items-start justify-between"
                >
                  <div>
                    <div className="font-medium text-white">{sop.title}</div>
                    <div className="text-xs text-gray-400">
                      {sop.frequency
                        ? sop.frequency.charAt(0).toUpperCase() +
                          sop.frequency.slice(1)
                        : "—"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm ${
                        status === "completed"
                          ? "text-green-400"
                          : "text-yellow-300"
                      }`}
                    >
                      {status === "completed" ? "Completed" : "Pending"}
                    </div>
                    {completedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {moment(completedAt).format("DD MMM YYYY, hh:mm A")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <SopModal
        key={editData?._id || "new"}
        isOpen={openModal}
        onClose={handleCloseModal}
        onSuccess={fetchSops}
        editData={editData}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete SOP"
      >
        <DeleteAlert
          content="Are you sure you want to delete this SOP?"
          onDelete={async () => {
            try {
              await axiosInstance.delete(API_PATHS.SOPS.DELETE_SOP(deleteId));
              toast.success("SOP deleted");
              fetchSops();
            } catch {
              toast.error("Delete failed");
            } finally {
              setOpenDeleteAlert(false);
            }
          }}
          title="Delete SOP"
        />
      </Modal>
    </DashboardLayout>
  );
};

export default ManageSOPs;
