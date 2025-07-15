const InfoCard = ({ label, value, color }) => {
  // Turn "inProgress" → "in-Progress", "allTasks" → "all-Tasks", etc.
  const formattedValue = String(label).replace(
    /([a-z])([A-Z])/g,
    "$1-$2"
  );

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 md:w-2 h-3 md:h-5 ${color} rounded-full`}></div>
      <p className="text-sm md:text-[14px] text-gray-500">
        <span className="text-sm md:text-[15px] text-white font-semibold">
          {value}
        </span>{" "}
        {formattedValue}
      </p>
    </div>
  );
};

export default InfoCard;
