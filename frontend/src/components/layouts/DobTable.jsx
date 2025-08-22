import moment from "moment";
import React, { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import SpinLoader from "./SpinLoader";

const DobTable = () => {
  const [dobs, setDobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [expenseDraft, setExpenseDraft] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(API_PATHS.INTERVIEW.GET_DOB);
        const list = data.data || [];
        setDobs(list);
        const seed = {};
        list.forEach((u) => {
          seed[u._id] = u.expenseAmount ?? 0;
        });
        setExpenseDraft(seed);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveExpense = async (userId) => {
    try {
      setSaving((s) => ({ ...s, [userId]: true }));
      await axiosInstance.post(API_PATHS.INTERVIEW.UPDATE_DOB, {
        userId,
        amount: Number(expenseDraft[userId] || 0),
      });
      setDobs((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, expenseAmount: Number(expenseDraft[userId] || 0) }
            : u
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  };

  return (
    <div className="card my-5">
      {loading && <SpinLoader />}
      <div className="overflow-x-auto">
        <h2 className="text-lg font-regular mb-1">Birthdays</h2>

        <table className="min-w-full text-sm text-gray-200">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="py-2">Name</th>
              <th className="py-2">DOB</th>
              <th className="py-2">Department</th>
              <th className="py-2">Designation</th>
              <th className="py-2">Expense (₹)</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {dobs.map((d) => (
              <tr key={d._id} className="border-b border-white/20">
                <td className="py-2">{d.name}</td>
                <td className="py-2">{moment(d.dob).format("DD-MM-YYYY")}</td>
                <td className="py-2">{d.department}</td>
                <td className="py-2">{d.designation}</td>

                <td className="py-2">
                  <input
                    type="number"
                    className="w-28 bg-transparent border border-white/20 rounded px-2 py-1"
                    value={expenseDraft[d._id] ?? 0}
                    onChange={(e) =>
                      setExpenseDraft((prev) => ({
                        ...prev,
                        [d._id]: e.target.value,
                      }))
                    }
                    min="0"
                  />
                </td>
                <td className="py-2">
                  <button
                    onClick={() => saveExpense(d._id)}
                    className="px-3 py-1 bg-[#E43941] cursor-pointer hover:bg-[#da9194] text-white rounded text-sm"
                    disabled={saving[d._id]}
                  >
                    {saving[d._id] ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DobTable;
