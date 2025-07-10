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
