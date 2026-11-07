// Shared styles + labels used across components.
// Tailwind only picks up classes that are written out in full, that's why they're all spelled out here.

// for all text inputs, selects and textareas
export const inputClass =
  "w-full border rounded-[10px] px-3 py-2 text-sm placeholder:text-inksoft";

// db stores HIGH/MED/LOW, this is what the user sees
export const priorityLabels = { HIGH: "High", MED: "Med", LOW: "Low" };

export const priorityStyles = {
  HIGH: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
  MED: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  LOW: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
};

// gcal = synced from Google Calendar, local = added in the app
export const eventStyles = {
  gcal: { dot: "bg-blue-400", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  local: { dot: "bg-emerald-400", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
};
