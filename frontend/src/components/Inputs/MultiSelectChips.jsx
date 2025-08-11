import { useEffect, useMemo, useRef, useState } from "react";
import { ImCancelCircle } from "react-icons/im";

export default function MultiSelectChips({
  options = [], // [{label, value}]
  value = [], // array of selected values
  onChange, // (newArray) => void
  placeholder = "Select...",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Filter options by search text and remove already selected
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !value.includes(o.value))
      .filter((o) => !q || o.label.toLowerCase().includes(q));
  }, [options, value, query]);

  const add = (val) => {
    if (!value.includes(val)) onChange?.([...value, val]);
    setQuery("");
  };

  const remove = (val) => {
    onChange?.(value.filter((v) => v !== val));
  };

  return (
    <div className="relative" ref={wrapRef}>
      {/* Input Box with Chips */}
      <div
        className="w-full h-[45px] mt-2 rounded-md bg-[#ffffffe3] border border-slate-100 px-2.5 py-2 flex items-center overflow-scroll flex-wrap gap-1 cursor-text"
        onClick={() => setOpen(true)}
      >
        {value.length === 0 && (
          <span className="px-2 py-1 text-gray-900 text-sm">{placeholder}</span>
        )}

        {value.map((v) => {
          const opt = options.find((o) => o.value === v);
          const label = opt?.label ?? v;
          return (
            <span
              key={v}
              className="flex items-center gap-1 bg-red-500 border border-red-400 rounded-md px-2 py-1 text-xs text-white"
            >
              {label}
              <button
                type="button"
                className="text-gray-100 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
                aria-label={`Remove ${label}`}
              >
                <ImCancelCircle className="w-3 h-3 cursor-pointer" />
              </button>
            </span>
          );
        })}

        <input
          className="flex-1 bg-transparent outline-none px-2 py-1 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md  bg-[#ffffff] text-black border border-slate-100 shadow-lg max-h-56 overflow-auto">
          {filtered.length === 0 ? (
            <div
              className="px-3 py-2 text-sm text-gray-4
            900"
            >
              No options
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-1sd00"
                onClick={() => add(opt.value)}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
