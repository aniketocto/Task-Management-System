import React, { useEffect, useState } from "react";

const DATE_KEY = "SOP_LAST_DATE";

const DailySOP = ({ sops, email }) => {
  const todayKey = `SOP_CHECKED_${email}_${new Date()
    .toISOString()
    .slice(0, 10)}`;
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!email) return;

    const today = new Date().toISOString().slice(0, 10);
    const todayKey = `SOP_CHECKED_${email}_${today}`;

    // Cleanup: Remove old keys for this user
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`SOP_CHECKED_${email}_`) && key !== todayKey) {
        localStorage.removeItem(key);
      }
    });

    const saved = localStorage.getItem(todayKey);
    setChecked(saved ? JSON.parse(saved) : {});
  }, [email]);

  const handleCheckboxChange = (id) => {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    localStorage.setItem(todayKey, JSON.stringify(updated));
  };

  if (!sops?.length) return null;

  return (
    <div className="card">
      <h2 className="text-lg mb-2">Daily SOPs</h2>
      <ul>
        {sops.map((t, i) => (
          <li key={i} className="py-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={() => handleCheckboxChange(i)}
              id={`sop-task-${i}`}
            />
            <label htmlFor={`sop-task-${i}`}>
              <span className="font-medium">{t.title}</span>
              <span className="text-gray-400 ml-2">{t.description}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DailySOP;