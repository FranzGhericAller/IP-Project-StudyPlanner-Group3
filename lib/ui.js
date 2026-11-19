export const inputClass =
  "w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-ink rounded-[10px] px-3 py-2 text-sm placeholder:text-inksoft";

export const priorityLabels = { HIGH: "High", MED: "Med", LOW: "Low" };

export const priorityStyles = {
  HIGH: {
    bg: "bg-rose-100 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-800",
  },
  MED: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-800",
  },
  LOW: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-800",
  },
};

export const eventStyle = {
  bg: "bg-neutral-100 dark:bg-neutral-800",
  border: "border-neutral-200 dark:border-neutral-700",
  text: "text-neutral-700 dark:text-neutral-200",
  accent: "border-l-neutral-500 dark:border-l-neutral-400",
};

export const eventStyles = { gcal: eventStyle, local: eventStyle };

// logged study time on the calendar: dashed neutral outline, so it never competes with priority colors
export const studyStyle = {
  bg: "bg-white dark:bg-neutral-900",
  border: "border-neutral-400 dark:border-neutral-500",
  text: "text-neutral-600 dark:text-neutral-300",
};