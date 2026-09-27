export const eventTypeStyles ={
  gcal: { dot: "bg-blue-400", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  physics: { dot: "bg-emerald-400", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  exam: { dot: "bg-rose-400", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  chemistry: { dot: "bg-violet-400", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
};
export const priorityStyles ={
  High: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300", bar: "bg-rose-400" },
  Med: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", bar: "bg-amber-400" },
  Low: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", bar: "bg-emerald-400" },
};
export const tasks =[
  { id: 1, name: "Finish React component assignment", priority: "High" },
  { id: 2, name: "Review database normalization notes", priority: "Med" },
  { id: 3, name: "Read software engineering case study", priority: "Low" },
];
export const weekDays =[
  { label: "Mon", date: 1 },
  { label: "Tue", date: 2 },
  { label: "Wed", date: 3 },
  { label: "Thu", date: 4 },
  { label: "Fri", date: 5 },
  { label: "Sat", date: 6 },
  { label: "Sun", date: 7 },
];
export const weekHours =[
  "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM",
];
export const weekEvents =[
  { day: 1, hour: "9 AM", title: "Sprint Standup (GCal)", type: "gcal" },
  { day: 1, hour: "1 PM", title: "Web Dev Study", type: "physics" },
  { day: 2, hour: "10 AM", title: "Adviser Consultation (GCal)", type: "gcal" },
  { day: 2, hour: "3 PM", title: "Systems Review", type: "exam" },
  { day: 3, hour: "9 AM", title: "Web Dev Study", type: "physics" },
  { day: 3, hour: "2 PM", title: "Mobile Dev Review", type: "chemistry" },
  { day: 4, hour: "10 AM", title: "Lab Session (GCal)", type: "gcal" },
  { day: 4, hour: "12 PM", title: "Capstone Group Meeting (GCal)", type: "gcal" },
  { day: 4, hour: "1 PM", title: "Systems Review", type: "exam" },
  { day: 5, hour: "8 AM", title: "Web Dev Study", type: "physics" },
  { day: 6, hour: "10 AM", title: "Systems Review", type: "exam" },
  { day: 7, hour: "3 PM", title: "Mobile Dev Review", type: "chemistry" },
];
export const monthDots ={
  3: ["gcal"],
  5: ["exam", "gcal"],
  6: ["gcal"],
  9: ["exam"],
  10: ["gcal", "gcal"],
  12: ["physics"],
  15: ["physics", "physics"],
  18: ["gcal"],
  20: ["physics", "gcal"],
  21: ["exam"],
  24: ["physics"],
  25: ["exam", "gcal"],
  27: ["chemistry"],
  30: ["chemistry", "chemistry"],
};
export const monthGrid =[
  [31, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
];
export const resources ={
  "Google Drive":{
    color: "bg-blue-100",
    items: ["Web Dev - Lecture Notes.pdf", "Capstone Documentation.docx", "Mobile App UI Mockups (folder)"],
  },
  Notion:{
    color: "bg-neutral-200",
    items: ["Sprint Backlog", "Bug Tracker", "API Documentation — REST Services"],
  },
  "Local Files":{
    color: "bg-orange-100",
    items: ["project_prototype.zip", "database_schema.png", "thesis_draft_v2.docx"],
  },
};