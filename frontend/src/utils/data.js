import {
  LuClipboardCheck,
  LuLayoutDashboard,
  LuLogOut,
  LuSquare,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Manage Tasks",
    icon: LuClipboardCheck,
    path: "/admin/tasks",
  },
  {
    id: "03",
    label: "Create Task",
    icon: LuSquare,
    path: "/admin/create-task",
  },
  {
    id: "04",
    label: "Team Members",
    icon: LuClipboardCheck,
    path: "/admin/users",
  },
  {
    id: "05",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];

export const SIDE_MENU_USER_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/user/dashboard",
  },
  {
    id: "02",
    label: "My Tasks",
    icon: LuClipboardCheck,
    path: "/user/tasks",
  },
  {
    id: "03",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];

export const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "delayed", label: "Delayed" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const infoCard = [
  { label: "New Tasks", key: "new", color: "bg-primary" },
  { label: "InProgress Tasks", key: "inProgress", color: "bg-yellow-500" },
  { label: "Completed Tasks", key: "completed", color: "bg-green-500" },
  { label: "Pending Tasks", key: "pending", color: "bg-cyan-500" },
  { label: "Delayed Tasks", key: "delayed", color: "bg-red-500" },
  { label: "Total Tasks", key: "All", color: "bg-purple-500" },
];
