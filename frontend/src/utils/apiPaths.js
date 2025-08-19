export const BASE_URL = import.meta.env.VITE_SOCKET_URL;

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    UPLOAD_IMAGE: "/api/auth/upload-image",
    GOOGLE_AUTH: "/api/auth/google",
  },
  USERS: {
    GET_ALL_USERS: "/api/users", //get all user
    GET_USER_BY_ID: (userId) => `/api/users/${userId}`, //get user by id
    CREATE_USER: "/api/users", // create a new user admin only
    UPDATE_USER_BY_ID: (userId) => `/api/users/${userId}`,
    DELETE_USER_BY_ID: (userId) => `/api/users/${userId}`, // delete user by id Superadmin only
    GET_DEPARTMENT: "/api/users/department",
    TRANSFER_TASKS: (userId) => `/api/users/${userId}/transfer-tasks`,
  },
  COMPANY: {
    GET_COMPANY: "/api/company",
  },
  TASKS: {
    GET_DASHBOARD_DATA: "/api/tasks/dashboard-data", // get dashboard data
    GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data", // get user dashboard data
    GET_ALL_TASKS: "/api/tasks", // get all tasks
    GET_ADMIN_TASKS: "/api/tasks/admin-tasks", // get all tasks
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`, // get task by id
    CREATE_TASK: "/api/tasks/create-task", // create a new task admin only
    UPDATE_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`, // update task by id admin only
    DELETE_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`, // delete task by id SuperAdmin only

    UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`, // update task status
    UPDATE_TASK_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`, // update task checklist
  },
  REPORTS: {
    EXPORT_TASKS: "/api/reports/export/tasks", // export all tasks
    EXPORT_USERS: "/api/reports/export/users", // export all tasks
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  NOTIFICATION: {
    GET_NOTIFICATIONS: "/api/notify",
    MARK_NOTIFICATION_AS_READ: "/api/notify/mark-all-read",
  },
  DUE_DATE: {
    REQUEST_DUE_DATE_CHANGE: (task_id) =>
      `/api/tasks/${task_id}/due-date-request`,
    REVIEW_DUE_DATE_CHANGE: (task_id) =>
      `/api/tasks/${task_id}/due-date-approval`,
    DECIDE_DATE_CHANGE_REQUEST: (leadId, requestId) =>
      `/api/leads/${leadId}/date-change-request/${requestId}`,
  },
  CATEGORY: {
    GET_CATEGORIES: "/api/category",
  },
  LEADS: {
    CREATE_LEAD: "api/leads/create-lead",
    GET_LEADS: "/api/leads",
    GET_LEAD_BY_ID: (leadId) => `/api/leads/${leadId}`,
    UPDATE_LEAD_BY_ID: (leadId) => `/api/leads/${leadId}`,
    DELETE_LEAD_BY_ID: (leadId) => `/api/leads/${leadId}`,
    GET_DASHBOARD_DATA: "/api/leads/dashboard-data",
    GET_MEETINGS: "/api/leads/upcoming-meetings",
    MEETING_COUNTS: "/api/leads/meetings-count",
  },
  APPROVAL: {
    TASK_APPROVAL: (taskId) => `/api/tasks/${taskId}/approve`,
    CHECKLIST_APPROVAL: (taskId, checklistId) =>
      `/api/tasks/${taskId}/checklist/${checklistId}/approve`,
  },
  ATTENDANCE: {
    CHECK_IN: "/api/attendance/checkin",
    CHECK_OUT: "/api/attendance/checkout",
    GET_ATTENDANCE: "/api/attendance/me",
    GET_ALL_ATTENDANCE: "/api/attendance",
    GET_TODAY_ATTENDANCE: "/api/attendance/today",
    UPDATE_ATTENDANCE: "/api/attendance/save",
    EXPORT_ATTENDANCE: "/api/attendance/export",
  },

  TARGETS: {
    GET_TARGETS: "/api/targets/quarter",
    SET_TARGETS: "/api/targets/quarter",
    TARGET_PROGRESS: "/api/leads/target-progress",
  },

  HOLIDAYS: {
    SET_HOLIDAYS: "/api/holidays",
    DELETE_HOLIDAY_BY_ID: (holidayId) => `/api/holidays/${holidayId}`,
  },
  INTERVIEW: {
    CREATE_OPENING: "/api/interview/create-opening",
    GET_OPENINGS: "/api/interview/get-all-openings",
    UPDATE_OPENING: (id) => `/api/interview/update-opening/${id}`,
    DELETE_OPENING: (id) => `/api/interview/delete-opening/${id}`,
    CREATE_INTERVIEW: "/api/interview/create",
    GET_ALL_INTERVIEWS: "/api/interview/get-all-interviews",
    GET_UPCOMING_INTERVIEWS: "/api/interview/get-upcoming-interviews",
    UPDATE_INTERVIEW: (id) => `/api/interview/update-interview/${id}`,
    DELETE_INTERVIEW: (id) => `/api/interview/delete-interview/${id}`,
    ADD_DOCS : "/api/interview/add-docs",
    GET_DOCS: "/api/interview/get-docs",
  }
};
