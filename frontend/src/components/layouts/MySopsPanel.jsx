import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import moment from "moment";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem("taskManagerToken") }, // same token key you use for tasks
  transports: ["websocket"],
  withCredentials: true,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const MySopsPanel = () => {
  const suppressSyncRef = useRef(new Set());
  const [sops, setSops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchSops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.SOPS.GET_MY_SOPS);
      setSops(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch SOPs:", err);
      toast.error("Failed to load SOPs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  const freqCounts = useMemo(() => {
    const counts = { all: sops.length, daily: 0, weekly: 0, monthly: 0 };
    sops.forEach((s) => {
      const f = (s.frequency || "").toLowerCase();
      if (f === "daily") counts.daily += 1;
      else if (f === "weekly") counts.weekly += 1;
      else if (f === "monthly") counts.monthly += 1;
    });
    return counts;
  }, [sops]);

  const filteredSops = useMemo(() => {
    if (activeFilter === "all") return sops;
    return sops.filter(
      (s) => (s.frequency || "").toLowerCase() === activeFilter
    );
  }, [sops, activeFilter]);

  const toggleCompletion = async (sopId, checked) => {
    const prevSops = sops;

    suppressSyncRef.current.add(sopId);

    setSops((prev) =>
      prev.map((s) => (s._id === sopId ? { ...s, isCompleted: checked } : s))
    );
    setTogglingIds((prev) => new Set(prev).add(sopId));

    try {
      const res = await axiosInstance.post(
        API_PATHS.SOPS.TOGGLE_COMPLETE(sopId),
        { checked }
      );

      const serverData =
        (res && res.data && (res.data.data || res.data)) || null;

      console.log("toggleCompletion -> serverData:", serverData);

      const serverCompletedAt =
        serverData && serverData.completedAt !== undefined
          ? serverData.completedAt
          : null;

      setSops((prev) =>
        prev.map((s) =>
          s._id === sopId
            ? {
                ...s,
                ...(serverData && serverData.isCompleted !== undefined
                  ? { isCompleted: serverData.isCompleted }
                  : {}),
                completedAt: serverCompletedAt,
                ...(serverData && serverData._id ? serverData : {}),
              }
            : s
        )
      );

      toast.success(checked ? "Marked as completed" : "Marked as incomplete");
    } catch (error) {
      console.error("Toggle failed:", error);
      setSops(prevSops);
      toast.error("Failed to update SOP");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(sopId);
        return next;
      });
    }
  };

  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {FILTERS.map((f) => {
        const active = f.key === activeFilter;
        const count = freqCounts[f.key] ?? 0;
        return (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-shadow focus:outline-none cursor-pointer
              ${
                active
                  ? "bg-[#E43941] text-white shadow"
                  : "bg-gray-800 text-gray-200 hover:bg-gray-700"
              }`}
            aria-pressed={active}
            aria-label={`Filter ${f.label}`}
            title={`${f.label} (${count})`}
          >
            <span>{f.label}</span>
            <span
              className={`text-xs rounded-full px-2 py-0.5 ${
                active ? "bg-white/10" : "bg-white/5"
              } `}
              aria-hidden
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );

  useEffect(() => {
    const handler = (payload) => {
      const sopId = payload?.sopId;
      if (sopId && suppressSyncRef.current.has(sopId)) {
        suppressSyncRef.current.delete(sopId);
        return;
      }
      fetchSops();
    };

    socket.on("sop:sync", handler);

    return () => {
      socket.off("sop:sync", handler);
    };
  }, [fetchSops]);

  return (
    <div className="card p-4">
      <div className="mb-3 flex justify-between items-start">
        <h4 className="font-semibold">My SOPs</h4>
        <FilterBar />
      </div>

      {loading ? (
        <div className="text-gray-400">Loading SOPs...</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSops.map((sop) => (
            <div
              key={sop._id}
              className="bg-gray-800 p-3 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-medium text-white">{sop.title}</h5>
                  <span className="text-xs rounded-full px-2 py-0.5 capitalize bg-gray-700 text-gray-200">
                    {sop.frequency || "—"}
                  </span>
                </div>

                <p className="text-sm text-gray-400 mt-1">
                  {sop.description || "—"}
                </p>

                <div className="text-xs text-gray-300 mt-2">
                  <div>
                    <strong>Assigned to:</strong>{" "}
                    {typeof sop.assignedTo === "object"
                      ? sop.assignedTo.name || sop.assignedTo._id
                      : sop.assignedTo || "—"}
                  </div>
                  {sop.completedAt && (
                    <div>
                      <strong>Completed:</strong>{" "}
                      {moment(sop.completedAt).format("DD MMM YYYY, hh:mm A")}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!sop.isCompleted}
                    disabled={togglingIds.has(sop._id)}
                    onChange={(e) =>
                      toggleCompletion(sop._id, e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-200">
                    {sop.isCompleted ? "Completed" : "Mark complete"}
                  </span>
                </label>

                <small className="text-xs text-gray-400">
                  {sop.frequency === "daily" ? "Daily" : sop.frequency}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySopsPanel;
