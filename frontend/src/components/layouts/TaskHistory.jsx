import moment from "moment";

const TaskHistory = ({ logs, allUsers }) => {
  if (!logs || logs.length === 0) {
    return <p className="text-slate-400 text-sm mt-2">No history yet</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {logs
        .slice()
        .reverse()
        .map((log, idx) => {
          const changer = allUsers?.find(
            (u) => u._id === log.changedBy || u._id === log.requestedBy
          );
          const reviewer = allUsers?.find((u) => u._id === log.reviewedBy);

          return (
            <div
              key={idx}
              className="p-3 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
            >
              <p>
                <span className="font-medium">Old:</span>{" "}
                {log.oldDate ? moment(log.oldDate).format("DD MMM YYYY") : "—"}
              </p>
              <p>
                <span className="font-medium">New:</span>{" "}
                {log.newDate ? moment(log.newDate).format("DD MMM YYYY") : "—"}
              </p>
              <p className="capitalize">
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={
                    log.status === "approved"
                      ? "text-green-400"
                      : log.status === "rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {log.status}
                </span>
              </p>
              {changer && (
                <p>
                  <span className="font-medium">Requested by:</span>{" "}
                  {changer.name}
                </p>
              )}
              {log.reason && (
                <p>
                  <span className="font-medium">Reason:</span> {log.reason}
                </p>
              )}
              {reviewer && (
                <p>
                  <span className="font-medium">Reviewed by:</span>{" "}
                  {reviewer.name}
                </p>
              )}
              <p className="text-slate-400">
                {moment(log.date || log.reviewedAt).fromNow()}
              </p>
            </div>
          );
        })}
    </div>
  );
};

export default TaskHistory;
