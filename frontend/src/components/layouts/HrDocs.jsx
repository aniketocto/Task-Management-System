import { useContext, useEffect, useMemo, useState } from "react";
import { FaFileAlt, FaPlus, FaTimes } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinLoader from "./SpinLoader";
import Modal from "./Modal";
import { IoTrashOutline } from "react-icons/io5";
import { UserContext } from "../../context/userContext";

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

const HrDocsEditor = () => {
  const { user } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [doc, setDoc] = useState(null);

  const fields = useMemo(
    () => [
      { key: "recruitmentReport", label: "Recruitment Report" },
      { key: "onBoarding", label: "On boarding" },
      { key: "offBoarding", label: "Off boarding" },
      { key: "evalution", label: "Evaluation" },
      { key: "appraisal", label: "Appraisal" },
      { key: "hrPolicies", label: "HR Policies" },
      { key: "hrProcess", label: "HR Process" },
      { key: "hrTraining", label: "HR Training" },
      { key: "reimbursement", label: "Reimbursement" },
      { key: "pettyCash", label: "Petty Cash" },
      { key: "employeeExitForm", label: "Employee Exit Form" },
      { key: "employeeEng", label: "Employee Engagement" },
    ],
    []
  );

  const [form, setForm] = useState({
    recruitmentReport: [],
    onBoarding: [],
    offBoarding: [],
    evalution: [],
    appraisal: [],
    hrPolicies: [],
    hrProcess: [],
    hrTraining: [],
    reimbursement: [],
    pettyCash: [],
    employeeExitForm: [],
    employeeEng: [],
  });

  const fetchDoc = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosInstance.get(API_PATHS.INTERVIEW.GET_DOCS);
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

  useEffect(() => {
    fetchDoc();
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
        API_PATHS.INTERVIEW.ADD_DOCS,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-regular">Documents</h2>
        {user.department === "HR" && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-sm"
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
                          <span className="truncate max-w-[18rem]">{name}</span>
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
        title="Edit HR Doc Links"
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
                  onChange={(e) => updateRow(key, idx, { url: e.target.value })}
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
          <button onClick={save} className=" add-btn w-fit!" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {loading && <SpinLoader />}
    </div>
  );
};

export default HrDocsEditor;
