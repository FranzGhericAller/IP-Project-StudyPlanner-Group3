"use client";

// "This is an exam" checkbox, shared by TaskForm and EventForm.
// onChange gets true/false (not the event), so it works with the forms' setForm calls.
export default function ExamCheckbox({ checked, onChange, hint }) {
  return (
    <label htmlFor="isExam" className="mb-4 flex cursor-pointer items-start gap-2.5">
      <input
        id="isExam"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-blue-600"
      />
      <span>
        <span className="block text-sm font-medium">This is an exam</span>
        {hint ? <span className="block text-xs text-inksoft">{hint}</span> : null}
      </span>
    </label>
  );
}