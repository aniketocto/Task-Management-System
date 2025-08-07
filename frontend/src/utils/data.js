import {
  LuClipboardCheck,
  LuLayoutDashboard,
  LuLogOut,
  LuSquare,
} from "react-icons/lu";

import { RiTeamLine } from "react-icons/ri";

// export const SIDE_MENU_ADMIN_DATA = [
//   {
//     id: "01",
//     label: "Dashboard",
//     icon: LuLayoutDashboard,
//     path: "/admin/dashboard",
//   },
//   {
//     id: "02",
//     label: "Manage Tasks",
//     icon: LuClipboardCheck,
//     path: "/admin/tasks",
//   },
//   {
//     id: "03",
//     label: "Create Task",
//     icon: LuSquare,
//     path: "/admin/create-task",
//   },
//   {
//     id: "04",
//     label: "My Tasks",
//     icon: LuClipboardCheck,
//     path: "/admin/my-tasks",
//   },
//   {
//     id: "04",
//     label: "Manage Lead",
//     icon: LuClipboardCheck,
//     path: "/manage-lead",
//   },
//   {
//     id: "05",
//     label: "Logout",
//     icon: LuLogOut,
//     path: "logout",
//   },
// ];

// export const SIDE_MENU_SUPER_ADMIN_DATA = [
//   {
//     id: "01",
//     label: "Dashboard",
//     icon: LuLayoutDashboard,
//     path: "/admin/dashboard",
//   },
//   {
//     id: "03",
//     label: "Manage Tasks",
//     icon: LuClipboardCheck,
//     path: "/admin/tasks",
//   },
//   {
//     id: "04",
//     label: "Manage Lead",
//     icon: LuClipboardCheck,
//     path: "/manage-lead",
//   },
//   {
//     id: "04",
//     label: "Create Task",
//     icon: LuSquare,
//     path: "/admin/create-task",
//   },
//   {
//     id: "05",
//     label: "Create Leads",
//     icon: LuSquare,
//     path: "/leads-create",
//   },
//   {
//     id: "06",
//     label: "Team Members",
//     icon: RiTeamLine,
//     path: "/admin/users",
//   },
//   {
//     id: "07",
//     label: "Logout",
//     icon: LuLogOut,
//     path: "logout",
//   },
// ];

// export const SIDE_MENU_BE_USER_DATA = [
//   {
//     id: "01",
//     label: "Dashboard",
//     icon: LuLayoutDashboard,
//     path: "/admin/dashboard",
//   },
//   {
//     id: "04",
//     label: "Manage Lead",
//     icon: LuClipboardCheck,
//     path: "/manage-lead",
//   },
//   {
//     id: "02",
//     label: "Manage Tasks",
//     icon: LuClipboardCheck,
//     path: "/admin/tasks",
//   },
//   {
//     id: "02",
//     label: "My Tasks",
//     icon: LuClipboardCheck,
//     path: "/user/tasks",
//   },
//   {
//     id: "03",
//     label: "Create Task",
//     icon: LuSquare,
//     path: "/admin/create-task",
//   },
//   {
//     id: "04",
//     label: "Create Leads",
//     icon: LuClipboardCheck,
//     path: "/leads-create",
//   },
//   {
//     id: "05",
//     label: "Logout",
//     icon: LuLogOut,
//     path: "logout",
//   },
// ];

// export const SIDE_MENU_USER_DATA = [
//   {
//     id: "01",
//     label: "Dashboard",
//     icon: LuLayoutDashboard,
//     path: "/user/dashboard",
//   },
//   {
//     id: "02",
//     label: "View Tasks",
//     icon: LuClipboardCheck,
//     path: "/user/tasks",
//   },
//   {
//     id: "03",
//     label: "Logout",
//     icon: LuLogOut,
//     path: "logout",
//   },
// ];

export const MENU_DATA = [
  {
    label: "Tasks",
    children: [
      {
        label: "Dashboard",
        icon: LuLayoutDashboard,
        path: "/admin/dashboard", // Admins/SuperAdmins
        access: ({ role }) => role === "superAdmin" || role === "admin",
      },
      {
        label: "Dashboard",
        icon: LuLayoutDashboard,
        path: "/user/dashboard", // Users
        access: ({ role }) => role === "user",
      },
      {
        label: "Manage Tasks",
        icon: LuClipboardCheck,
        path: "/admin/tasks",
        access: ({ role }) => role === "superAdmin" || role === "admin",
      },
      {
        label: "Create Task",
        icon: LuSquare,
        path: "/admin/create-task",
        access: ({ role }) => role === "superAdmin" || role === "admin",
      },
      {
        label: "My Tasks",
        icon: LuClipboardCheck,
        path: "/admin/my-tasks",
        access: ({ role }) => role === "admin",
      },
      {
        label: "My Tasks",
        icon: LuClipboardCheck,
        path: "/user/tasks",
        access: ({ role }) => role === "user",
      },
      {
        label: "View Tasks",
        icon: LuClipboardCheck,
        path: "/user/tasks",
        access: ({ role }) => role === "user",
      },
    ],
  },
  {
    label: "Leads",
    children: [
      {
        label: "Lead Dashboard",
        icon: LuLayoutDashboard,
        path: "/leads",
        access: ({ role, department }) =>
          role === "superAdmin" ||
          (role === "admin" && department === "BusinessDevelopment"),
      },
      {
        label: "Manage Lead",
        icon: LuClipboardCheck,
        path: "/manage-lead",
        access: ({ role }) => role === "superAdmin" || role === "admin",
      },
      {
        label: "Create Leads",
        icon: LuSquare,
        path: "/leads-create",
        access: ({ role, department }) =>
          role === "superAdmin" ||
          (role === "admin" && department === "BusinessDevelopment"),
      },
    ],
  },
  {
    label: "Team",
    children: [
      {
        label: "Team Members",
        icon: RiTeamLine,
        path: "/admin/users",
        access: ({ role }) => role === "superAdmin",
      },
    ],
  },
  {
    label: "Account",
    children: [
      // {
      //   label: "Attendance",
      //   icon: LuLogOut,
      //   path: "/user/attendance",
      //   access: () => true, // Everyone sees logout
      // },
      {
        label: "Logout",
        icon: LuLogOut,
        path: "logout",
        access: () => true, // Everyone sees logout
      },
    ],
  },
];

export const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const TASK_TYPE = [
  { value: "operational", label: "Operational" },
  { value: "creative", label: "Creative" },
];

export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "delayed", label: "Delayed" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const infoCard = [
  {
    label: "New Tasks",
    key: "new",
    key1: "newTasks",
    key2: "new",
    color: "bg-[#3956E4]",
    description: "Newly allotted tasks not yet started",
  },
  {
    label: "InProgress Tasks",
    key: "inProgress",
    key1: "inProgressTasks",
    key2: "inProgress",
    color: "bg-[#E48E39]",
    description: "Tasks started and ongoing, still within the due date",
  },
  {
    label: "Completed Tasks",
    key: "completed",
    key1: "completedTasks",
    key2: "completed",
    color: "bg-[#6FE439]",
    description: "Tasks finished on or before the due date",
  },
  {
    label: "Pending Tasks",
    key: "pending",
    key1: "pendingTasks",
    key2: "pending",
    color: "bg-[#39C5E4]",
    description: "Tasks in progress but the due date has passed",
  },
  {
    label: "Delayed Tasks",
    key: "delayed",
    key1: "delayedTasks",
    key2: "delayed",
    color: "bg-[#E43941]",
    description: "Tasks completed after the due date",
  },
  {
    label: "Total Tasks",
    key: "All",
    key1: "all",
    key2: "all",
    color: "bg-[#B439E4]",
    description: "All tasks assigned to you",
  },
];

export const leadStats = [
  { label: "Onboarded ", key: "onboardedLeads", color: "bg-green-500" },
  { label: "Follow-Up ", key: "followUpLeads", color: "bg-yellow-500" },
  { label: "New ", key: "newLeads", color: "bg-orange-500" },
  { label: "Agreement ", key: "agreementLeads", color: "bg-blue-500" },
  { label: "Pitch", key: "pitchLeads", color: "bg-purple-500" },
  {
    label: "Negotiation ",
    key: "negotiationLeads",
    color: "bg-indigo-500",
  },
  { label: "Dead ", key: "deadLeads", color: "bg-red-500" },
  { label: "Legal ", key: "legalLeads", color: "bg-gray-500" },
  { label: "Total ", key: "totalLeads", color: "bg-white" },
];

export const officeQuotes = {
  1: "Teamwork makes the dream work.",
  2: "Stay positive, work hard, make it happen.",
  3: "Progress, not perfection.",
  4: "Dream big. Start small. Act now.",
  5: "Do what you love. Love what you do.",
  6: "Small steps every day lead to big results.",
  7: "Be the reason someone smiles today.",
  8: "Success is a journey, not a destination.",
  9: "Great things never came from comfort zones.",
  10: "Work smarter, not just harder.",
  11: "Your vibe attracts your tribe.",
  12: "Act like you own the place—responsibly.",
  13: "Mistakes are proof you’re trying.",
  14: "Good vibes only.",
  15: "Don’t count the hours. Make the hours count.",
  16: "Stay humble. Work hard. Be kind.",
  17: "Better an oops than a what if.",
  18: "Kindness is free. Sprinkle it everywhere.",
  19: "Be so good they can’t ignore you.",
  20: "Leave people better than you found them.",
  21: "Chase progress, not perfection.",
  22: "Smile—it confuses people.",
  23: "Be a fountain, not a drain.",
  24: "You’re capable of amazing things.",
  25: "Work hard in silence. Let success make noise.",
  26: "Coffee and kindness can fix almost anything.",
  27: "Everything is figureoutable.",
  28: "Be the energy you want to attract.",
  29: "Nothing changes if nothing changes.",
  30: "Good things take time.",
  31: "Leave excuses at the door.",
  32: "Dream it. Do it.",
  33: "Hustle in silence. Shine in public.",
  34: "Your only limit is you.",
  35: "One day at a time.",
  36: "Be a voice, not an echo.",
  37: "Collect moments, not things.",
  38: "Make today ridiculously amazing.",
  39: "The best way out is always through.",
  40: "Focus on solutions, not problems.",
  41: "Attitude is everything.",
  42: "Less stress, more success.",
  43: "It always seems impossible until it’s done.",
  44: "You miss 100% of the shots you don’t take.",
  45: "Create your own sunshine.",
  46: "One small positive thought can change everything.",
  47: "Be brave. Take risks.",
  48: "Don’t stop until you’re proud.",
  49: "Strive for progress, not perfection.",
  50: "Positivity is contagious.",
  51: "The best time for new beginnings is now.",
  52: "If it doesn’t challenge you, it won’t change you.",
  53: "Believe you can, and you’re halfway there.",
  54: "Your future is created by what you do today.",
  55: "Throw kindness around like confetti.",
  56: "You’ve got this.",
  57: "Stay curious. Stay inspired.",
  58: "Focus on the good.",
  59: "Start each day with a grateful heart.",
  60: "Happiness is homemade.",
  61: "Stay strong. Stay positive.",
  62: "Success is the sum of small efforts.",
  63: "Be your own biggest fan.",
  64: "Every day is a fresh start.",
  65: "Don’t wish for it. Work for it.",
  66: "Be kind to your mind.",
  67: "Focus on what matters.",
  68: "Keep going. You’re getting there.",
  69: "Work hard. Stay humble.",
  70: "Be the light in someone’s day.",
  71: "Success starts with self-discipline.",
  72: "You are enough.",
  73: "Enjoy the little things.",
  74: "Your vibe is your power.",
  75: "The harder you work, the luckier you get.",
  76: "Be fearless in pursuit of your goals.",
  77: "The best project you’ll ever work on is you.",
  78: "You’re doing better than you think.",
  79: "Never stop learning.",
  80: "Don’t look back—you’re not going that way.",
  81: "Be proud of how far you’ve come.",
  82: "Push yourself because no one else will.",
  83: "When in doubt, smile.",
  84: "Do it with passion or not at all.",
  85: "Be positive, patient, persistent.",
  86: "A little progress each day adds up.",
  87: "Kindness wins.",
  88: "Don’t let yesterday take too much of today.",
  89: "Be the change you wish to see.",
  90: "Stay focused and never give up.",
  91: "One kind word can change someone’s day.",
  92: "Work hard. Play hard.",
  93: "Leave a little sparkle everywhere you go.",
  94: "Doubt kills more dreams than failure ever will.",
  95: "Take it one step at a time.",
  96: "Do something today your future self will thank you for.",
  97: "Be better than you were yesterday.",
  98: "Don’t be busy. Be productive.",
  99: "Smiles are contagious. Pass them on.",
  100: "Great things take effort.",
};

export const OPPO_STATUS = [
  { value: "new", label: "New" },
  { value: "followUp", label: "Follow Up" },
  { value: "dead", label: "Dead" },
  { value: "onboarded", label: "Onboarded" },
  { value: "negotiation", label: "Negotiation" },
  { value: "agreement", label: "Agreement" },
  { value: "pitch", label: "Pitch" },
  { value: "legal", label: "Legal" },
];

export const OPPO_TYPE = [
  { value: "realEstate", label: "Retainer" },
  { value: "project", label: "Project" },
];

export const LEAD_TYPE = [
  { value: "realEstate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality" },
  { value: "bsfi", label: "BSFI" },
  { value: "healthcare", label: "Healthcare" },
  { value: "wellness", label: "Wellness" },
  { value: "fnb", label: "F&B" },
  { value: "agency", label: "Agency" },
  { value: "fashion", label: "Fashion" },
  { value: "other", label: "Others" },
];

export const LEAD_SERVICE = [
  { value: "logoDesign", label: "Logo Design" },
  { value: "socialMediaManagement", label: "Social Media Management" },
  { value: "leadGeneration", label: "Lead Generation" },
  { value: "webDesignNDev", label: "Web Design & Development" },
  { value: "appDesignNDev", label: "App Design & Development" },
  { value: "videoProduction", label: "Video Production" },
  { value: "branding", label: "Branding" },
  { value: "visualIdentity", label: "Visual Identity" },
  { value: "coffeeTableBook", label: "Coffee Table Book" },
  { value: "brochures", label: "Brochures" },
  { value: "merchandise", label: "Merchandise" },
  { value: "stallDesign", label: "Stall Design" },
  { value: "influencerMarketing", label: "Influencer Marketing" },
  { value: "siteBranding", label: "Site Branding" },
  { value: "packaging", label: "Packaging" },
  { value: "energy", label: "Energy" },
  { value: "others", label: "Others" },
];

export const LEAD_SOURCE = [
  { value: "website", label: "Website" },
  { value: "inboundWhatsApp", label: "Inbound Whatsapp" },
  { value: "outboundWhatsApp", label: "Outbound Whatsapp" },
  { value: "inboundCall", label: "Inbound Call" },
  { value: "outboundCall", label: "Outbound Call" },
  { value: "inboundEmail", label: "Inbound Email" },
  { value: "outboundEmail", label: "Outbound Email" },
  { value: "metaAds", label: "Meta Ads" },
  { value: "googleAds", label: "Google Ads" },
  { value: "events", label: "Events" },
  { value: "referral", label: "Referral" },
  { value: "others", label: "Others" },
];

export const statsColors = [
  "#6366F1", // indigo for Total
  "#FBBF24", // amber for Follow-Up
  "#EF4444", // red for Dead
  "#10B981", // green for Onboarded
  "#8B5CF6", // purple for Pitch
];
