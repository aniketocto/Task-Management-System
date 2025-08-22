import { useEffect, useMemo, useState } from "react";
import { FaFileAlt, FaPlus, FaRegFileAlt } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinLoader from "./SpinLoader";
import Modal from "./Modal";
import { IoTrashOutline } from "react-icons/io5";
import { UserContext } from "../../context/userContext";
import toast from "react-hot-toast";
import Input from "components/Inputs/Input";

const normalizeUrl = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return [val];
  if (typeof val === "object" && (val.url || val.link || val.href))
    return [{ name: val.name || "Link", url: val.url || val.link || val.href }];
  return [];
};

const LeadEventReport = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [doc, setDoc] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(null);

  const [openEventModal, setOpenEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    eventName: "",
    industry: "",
    pass: "",
    expense: "",
    leadReport: "",
  });

  const clearEventData = () => {
    setEventForm({
      eventName: "",
      industry: "",
      pass: "",
      expense: "",
      leadReport: "",
    });
  };
  const handleValueChange = (key, value) => {
    setEventForm((prevData) => ({ ...prevData, [key]: value }));
  };

  const getEvents = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.LEADREPORT.GET_EVENTS);
      setEvents(res?.data?.data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to fetch interviews.");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      setLoading(true);
      const resp = await axiosInstance.post(
        API_PATHS.LEADREPORT.ADD_EVENT,
        eventForm
      );
      if (resp) {
        clearEventData();
        setOpenEventModal(false);
        getEvents();
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId) => {
    try {
      setLoading(true);
      const resp = await axiosInstance.put(
        API_PATHS.LEADREPORT.UPDATE_EVENT(eventId),
        eventForm
      );
      if (resp) {
        clearEventData();
        setEventId(null);
        setOpenEventModal(false);
        getEvents();
      }
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  const fields = useMemo(
    () => [
      { key: "coldCalling", label: "Cold Calling" },
      { key: "emailMarketing", label: "Email Marketing" },
      { key: "whatsappMarketing", label: "WhatsApp Marketing" },
      { key: "entireDb", label: "Database" },
    ],
    []
  );

  const [form, setForm] = useState({
    coldCalling: [],
    emailMarketing: [],
    whatsappMarketing: [],
    entireDb: [],
  });

  const fetchDoc = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosInstance.get(API_PATHS.LEADREPORT.GET_DOCS);
      const data = res?.data?.data || null;
      setDoc(data);
      const next = { ...form };
      fields.forEach(({ key }) => {
        next[key] = toArray(data?.[key]).map((v) =>
          typeof v === "string"
            ? { name: "Link", url: v }
            : { name: v.name || "Link", url: v.url || v.link || v.href }
        );
      });
      setForm(next);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load docs");
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    user.role === "superAdmin" ||
    (user.role === "admin" && user.department === "BusinessDevelopment");

  useEffect(() => {
    fetchDoc();
    getEvents();
  }, []);

  const addRow = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], { name: "Link", url: "" }],
    }));
  };

  const removeRow = (key, idx) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));
  };
  const updateRow = (key, idx, patch) => {
    setForm((prev) => {
      const copy = [...prev[key]];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, [key]: copy };
    });
  };

  const buildPayload = () => {
    const payload = {};
    fields.forEach(({ key }) => {
      const rows = (form[key] || []).filter((r) => r.url && r.url.trim());
      if (rows.length === 0) return;
      if (rows.length === 1) {
        payload[key] = {
          name: rows[0].name || "Link",
          url: normalizeUrl(rows[0].url),
        };
      } else {
        payload[key] = rows.map((r) => ({
          name: r.name || "Link",
          url: normalizeUrl(r.url),
        }));
      }
    });
    return payload;
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = buildPayload();
      const res = await axiosInstance.post(
        API_PATHS.LEADREPORT.ADD_DOCS,
        payload
      );
      setDoc(res?.data?.data || null);
      setOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save docs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SpinLoader />;

  return (
    <div className="my-5 flex justify-between gap-3 items-start">
      {/* Events */}
      <div className="card lg:w-[70%] w-full">
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-regular mb-1">Events</h2>
            {disabled && (
              <button
                onClick={() => {
                  setOpenEventModal(true);
                }}
                className=" add-btn w-fit!"
              >
                Set Event
              </button>
            )}
          </div>
          <table className="min-w-full text-sm text-gray-200">
            <thead>
              <tr className="text-left border-b border-white/20">
                <th className="py-2 pr-4">Event Name</th>
                <th className="py-2 pr-4">Industry</th>
                <th className="py-2 pr-4">Visitor's Pass</th>
                <th className="py-2 pr-4">Visitor's Pass Expense</th>
                <th className="py-2 pr-4"> Leads Report</th>
                <th className="py-2 pr-4"> Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((eve) => (
                <tr key={eve._id} className="border-b border-white/20">
                  <td className="py-2 pr-4">{eve.eventName || "-"}</td>
                  <td className="py-2 pr-4">{eve.industry || "-"}</td>
                  <td className="py-2 pr-4">
                    {eve.pass ? (
                      <a
                        href={normalizeUrl(eve.pass)}
                        target="_blank"
                        rel="noopener"
                        className="text-[#E43941] text-lg font-medium"
                      >
                        <FaRegFileAlt />
                      </a>
                    ) : (
                      <span className="text-gray-500">–</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{eve.expense}</td>
                  <td className="py-2 pr-4">
                    {eve.leadReport ? (
                      <a
                        href={normalizeUrl(eve.leadReport)}
                        target="_blank"
                        rel="noopener"
                        className="text-[#E43941] text-lg font-medium"
                      >
                        <FaRegFileAlt />
                      </a>
                    ) : (
                      <span className="text-gray-500">–</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEventForm({ ...eve });
                        setEventId(eve._id);
                        setOpenEventModal(true);
                      }}
                      className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Report */}
      <div className="card lg:w-[30%] w-full">
        <div className="flex items-center justify-between pb-1 mb-2 border-b border-gray-50/20 ">
          <h2 className="text-lg font-regular">Leads Reports</h2>
          {disabled && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-sm"
            >
              <FaPlus />
              Edit Links
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {fields.map(({ key, label }) => {
            const items = toArray(doc?.[key]);
            return (
              <div key={key} className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-200 mb-2">
                  {label}
                </div>
                {items.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {items.map((it, i) => {
                      const name =
                        typeof it === "string" ? "Link" : it.name || "Link";
                      const url =
                        typeof it === "string"
                          ? it
                          : it.url || it.link || it.href;
                      return (
                        <li key={`${key}-${i}`}>
                          <a
                            href={normalizeUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 px-2 py-1 rounded-md bg-white/5 border border-white/10"
                          >
                            <FaFileAlt className="text-base" />
                            <span className="truncate max-w-[18rem]">
                              {name}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500">Not added</div>
                )}
              </div>
            );
          })}
        </div>

        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Edit Lead Reports Links"
        >
          {fields.map(({ key, label }) => (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium mb-1">{label}</label>
              {(form[key] || []).map((row, idx) => (
                <div key={`${key}-${idx}`} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 px-2 py-1 border rounded"
                    placeholder="https://..."
                    value={row.url}
                    onChange={(e) =>
                      updateRow(key, idx, { url: e.target.value })
                    }
                  />
                  <button type="button" onClick={() => removeRow(key, idx)}>
                    <IoTrashOutline className="text-red-500 text-xl cursor-pointer" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(key)}
                disabled={(form[key] || []).length > 0}
                className={`px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm disabled:bg-gray-600 disabled:cursor-not-allowed ${
                  (form[key] || []).length > 0
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                } `}
              >
                Add
              </button>
            </div>
          ))}

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className=" add-btn w-fit!"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>
      </div>

      <Modal
        isOpen={openEventModal}
        onClose={() => {
          setOpenEventModal(false);
          clearEventData();
          setEventId(null);
        }}
        title={eventId ? "Edit Event" : "Add Event"}
      >
        <Input
          placeholder="Enter Event name"
          value={eventForm.eventName}
          onChange={(e) => handleValueChange("eventName", e.target.value)}
          label="Event Name"
          type="text"
        />
        <Input
          placeholder="Enter Industry"
          value={eventForm.industry}
          onChange={(e) => handleValueChange("industry", e.target.value)}
          label="Industry"
          type="text"
        />
        <Input
          placeholder="Visitor's Pass"
          value={eventForm.pass}
          onChange={(e) => handleValueChange("pass", e.target.value)}
          label="Visitor's Pass "
          type="text"
        />
        <Input
          placeholder="Visitor's Pass Expense"
          value={eventForm.expense}
          onChange={(e) => handleValueChange("expense", e.target.value)}
          label="Visitor's Pass Expense"
          type="text"
        />
        <Input
          placeholder="Lead Reports"
          value={eventForm.leadReport}
          onChange={(e) => handleValueChange("leadReport", e.target.value)}
          label="Lead Reports"
          type="text"
        />

        <button
          onClick={() => {
            if (eventId) {
              updateEvent(eventId);
            } else {
              createEvent();
            }
          }}
          className="px-3 py-1 bg-[#E43941] hover:bg-[#da9194] text-white rounded text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {eventId ? "Update" : "Add"}
        </button>
      </Modal>
    </div>
  );
};

export default LeadEventReport;
