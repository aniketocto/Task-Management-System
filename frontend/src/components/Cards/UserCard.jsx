

const UserCard = ({ userInfo }) => {


  return (
    <div className="user-card p-2 cursor-pointer">
      <div className="flex items-start flex-col justify-between">
        <div className="flex items-center gap-3">
          <img
            src={userInfo?.profileImageUrl}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 object-contain border-white"
          />

          <div className="">
            <p className="text-sm font-medium">{userInfo?.name}</p>
            <p className="text-xs text-gray-500">{userInfo?.department}</p>
            <p className="text-xs text-gray-500">{userInfo?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-gray-200 py-3 mt-5">
          <StatCard label="Total" count={userInfo?.totalTask} />
          <StatCard label="New" count={userInfo?.newTask} />
          <StatCard label="InProgress" count={userInfo?.inProgressTask} />
          <StatCard label="Completed" count={userInfo?.completedTask} />
          <StatCard label="Delayed" count={userInfo?.delayedTask} />
          <StatCard label="Pending" count={userInfo?.pendingTask} />
        </div>
      </div>
    </div>
  );
};

export default UserCard;

const StatCard = ({ label, count }) => {
  const getStatusColor = (label) => {
    switch (label) {
      case "New":
        return "text-primary";
      case "InProgress":
        return "text-yellow-500";
      case "Completed":
        return "text-green-500";
      case "Pending":
        return "text-cyan-500";
      case "Delayed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 px-2.5 py-1 rounded-md ">
      <p
        className={`text-sm md:text-[15px] ${getStatusColor(
          label
        )} font-semibold`}
      >
        {" "}
        {count}
      </p>
      <p className={`text-sm md:text-[14px] ${getStatusColor(label)} `}>
        {label}
      </p>
    </div>
  );
};
