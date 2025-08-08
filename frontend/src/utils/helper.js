export const validateEmail = (email) => {
  // Check if email is a string, and ends correctly
  const regex = /^[^\s@]+@getunstoppable\.in$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  // const hasSpecialChar = /[!@#$%^&*()_\-+=<>?{}[\]~]/.test(password);
  const isLongEnough = password.length >= 6;

  return (
    hasUppercase &&
    hasLowercase &&
    hasDigit /* && hasSpecialChar */ &&
    isLongEnough
  );
};
export const getGreeting = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

export const addThousandsSeperator = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const findChartsOrFallback = ({
  month,
  department,
  availableMonths,
  dashboardData,
}) => {
  if (!dashboardData) return null;

  const isMonthAll = month === "" || month === "all";
  const isDeptAll = department === "" || department === "all";

  // 📌 Case: all + all → all-time charts
  if (isMonthAll && isDeptAll) {
    return dashboardData?.charts || null;
  }

  // 📌 Case: selected month + all departments
  if (!isMonthAll && isDeptAll) {
    const monthData = availableMonths.find((m) => m.value === month);
    if (monthData?.charts) {
      return monthData.charts;
    } else {
      console.warn(`No charts for month=${month}`);
      return null;
    }
  }

  // 📌 Case: all months + selected department
  if (isMonthAll && !isDeptAll) {
    const deptData =
      dashboardData?.charts?.departmentDistribution?.[department];
    if (deptData) {
      return {
        taskDistribution: deptData.statusBreakdown,
        taskPrioritiesLevels: deptData.priorityBreakdown,
      };
    } else {
      console.warn(`No all-time charts for department=${department}`);
      return null;
    }
  }

  // 📌 Case: selected month + selected department
  if (!isMonthAll && !isDeptAll) {
    const monthData = availableMonths.find((m) => m.value === month);
    if (!monthData) {
      console.warn(`No month data for month=${month}`);
      return null;
    }

    const deptData = monthData.departmentBreakdown?.[department];
    if (deptData?.charts) {
      return deptData.charts;
    } else {
      console.warn(`No charts for month=${month} and department=${department}`);
      return null;
    }
  }

  return null;
};

export const getInfoCardChartData = ({
  dashboardData,
  filterMonth,
  filterDepartment,
}) => {
  // Department+Month selected: use breakdown
  if (
    filterMonth &&
    filterDepartment &&
    dashboardData?.monthlyData?.monthsData?.length
  ) {
    const monthObj = dashboardData.monthlyData.monthsData.find(
      (m) => m.value === filterMonth
    );
    if (
      monthObj &&
      monthObj.departmentBreakdown &&
      monthObj.departmentBreakdown[filterDepartment] &&
      monthObj.departmentBreakdown[filterDepartment].charts &&
      monthObj.departmentBreakdown[filterDepartment].charts.taskDistribution
    ) {
      return monthObj.departmentBreakdown[filterDepartment].charts
        .taskDistribution;
    }
  }

  // Month only: use month's main chart
  if (filterMonth && dashboardData?.monthlyData?.monthsData?.length) {
    const monthObj = dashboardData.monthlyData.monthsData.find(
      (m) => m.value === filterMonth
    );
    if (monthObj && monthObj.charts && monthObj.charts.taskDistribution) {
      return monthObj.charts.taskDistribution;
    }
  }

  // Default: use top-level charts
  return dashboardData?.charts?.taskDistribution || {};
};

export const addBusinessDays = (dateStr, numDays) => {
  if (!dateStr) return "";
  let date = new Date(dateStr);
  let added = 0;
  while (added < numDays) {
    date.setDate(date.getDate() + 1); // Go to next day
    if (date.getDay() !== 0) {
      // If NOT Sunday
      added++; // Count this as a "business" day
    }
    // If it is Sunday (date.getDay() === 0), do nothing (don’t increment added)
  }
  // Format for datetime-local input
  return date.toISOString().slice(0, 16);
};

export const beautify = (text) => {
  if (!text) return "-";
  // Replace underscores/dashes with space, then insert space before capital letters
  return text
    .replace(/[_-]/g, " ") // snake_case or kebab-case to spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase to space
    .replace(/\s+/g, " ") // remove extra spaces
    .replace(/^\w/, (c) => c.toUpperCase()) // capitalize first letter
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatDecimalHours = (decimalHours) => {
  if (!decimalHours && decimalHours !== 0) return "—";

  const hours = Math.floor(decimalHours); // whole hours
  const minutes = Math.round((decimalHours - hours) * 60); // remaining minutes

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

