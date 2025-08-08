import moment from "moment";
import { formatDecimalHours } from "../../utils/helper";

const Calendar = ({
  monthStart,
  daysInMonth,
  attendanceMap,
  getStatusColor,
  beautify,
}) => {
  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const startOfMonth = monthStart.clone().startOf("month");

  const leadingBlanks = startOfMonth.isoWeekday() - 1; // 0=Mon, 6=Sun

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(startOfMonth.clone().date(d));
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="w-full">
      <div className="space-y-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((dateObj, di) => {
              if (!dateObj) {
                // Empty cell (before the 1st of month when month doesn't start on Monday)
                return <div key={`blank-${wi}-${di}`} className="" />;
              }

              // Extract data
              const key = dateObj.format("YYYY-MM-DD");
              const attendance = attendanceMap[key];
              const statusColor = getStatusColor(attendance?.checkInStatus);

              return (
                <div
                  key={key}
                  className={[
                    "rounded-lg border p-5 min-h-[110px] transition-all duration-150",
                    statusColor ? `${statusColor} bg-opacity-20` : "",
                    "hover:shadow-sm hover:-translate-y-[1px]",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm text-white font-medium">
                      {dateObj.format("DD MMM")}
                      <span className="block text-[10px] ">
                        {dateObj.format("dddd")}
                      </span>
                    </div>
                    {attendance?.checkInStatus && (
                      <span
                        className={[
                          "text-[10px] px-1.5 py-0.5 rounded-full",
                          statusColor
                            ? statusColor.replace("bg-", "bg-")
                            : "bg-gray-100",
                          "text-gray-100",
                        ].join(" ")}
                      >
                        {formatDecimalHours(attendance.totalHours) || "—"}
                      </span>
                    )}
                  </div>

                  {attendance ? (
                    <div className="mt-2 text-white text-xs space-y-1">
                      <div>
                        {attendance.checkIn
                          ? moment(attendance.checkIn).format("hh:mm A")
                          : "—"}{" "}
                        -{" "}
                        <span className="capitalize">
                          {beautify(attendance.checkInStatus) || "—"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {attendance.checkOut
                          ? moment(attendance.checkOut).format("hh:mm A")
                          : "—"}
                        {attendance.checkOutStatus === "early" && (
                          <span className="capitalize">
                            - {beautify(attendance.checkOutStatus) || "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-[11px] text-gray-300 italic">
                      No entry
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
