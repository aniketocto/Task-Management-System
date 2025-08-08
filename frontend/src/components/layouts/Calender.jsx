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
    <div className="min-w-[550px]">
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
                    "rounded-lg border transition-all duration-150",
                    "p-2 sm:p-3 md:p-4",
                     // squares on phones
                    "min-h-[150px] sm:min-h-[96px] md:min-h-[110px]",
                    statusColor ? `${statusColor} bg-opacity-20` : "",
                    "hover:shadow-sm hover:-translate-y-[1px]",
                    "overflow-hidden", // prevent overflow
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-xs sm:text-sm text-white font-medium leading-tight">
                      {dateObj.format("DD MMM")}
                      <span className="block text-[10px] sm:text-[11px] md:text-[12px] leading-tight">
                        {/* show short weekday on tiny screens */}
                        <span className="sm:hidden">
                          {dateObj.format("dd")}
                        </span>
                        <span className="hidden sm:inline">
                          {dateObj.format("dddd")}
                        </span>
                      </span>
                    </div>

                    {attendance?.checkInStatus && (
                      <span
                        className={[
                          "text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full shrink-0",
                          statusColor
                            ? statusColor.replace("bg-", "bg-")
                            : "bg-gray-700",
                          "text-gray-100",
                        ].join(" ")}
                      >
                        {formatDecimalHours(attendance.totalHours) || "—"}
                      </span>
                    )}
                  </div>

                  {attendance ? (
                    <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-white space-y-0.5 sm:space-y-1 leading-snug">
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {attendance.checkIn
                          ? moment(attendance.checkIn).format("hh:mm A")
                          : "—"}{" "}
                        -{" "}
                        <span className="capitalize">
                          {beautify(attendance.checkInStatus) || "—"}
                        </span>
                      </div>
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {attendance.checkOut
                          ? moment(attendance.checkOut).format("hh:mm A")
                          : "—"}
                        {attendance.checkOutStatus === "early" && (
                          <span className="capitalize">
                            {" "}
                            - {beautify(attendance.checkOutStatus) || "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Hide "No entry" label on tiny screens to reduce clutter
                    <div className="mt-2 text-[10px] sm:text-[11px] text-gray-300 italic hidden xs:block">
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
