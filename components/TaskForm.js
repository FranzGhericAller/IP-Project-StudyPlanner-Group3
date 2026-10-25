"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import Field from "@/components/auth/Field";
import { priorityStyles } from "@/lib/data";

const inputClass =
  "w-full border rounded-[10px] px-3 py-2 text-sm placeholder:text-inksoft";

// Turns an ISO date into "2026-10-25T09:00" in the browser's timezone,
// which is the format <input type="datetime-local"> needs.
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Used for both "Add task" (no props) and "Edit task" (taskId + initial values).
export default function TaskForm({ taskId, initial }) {
  const editing = Boolean(taskId);
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    title: initial?.title ?? "",
    subject: initial?.subject ?? "",
    dueAt: toLocalInput(initial?.dueAt),
    notes: initial?.notes ?? "",
  }));
  const [priority, setPriority] = useState(initial?.priority ?? "Med");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!form.title.trim()) {
      setErrors({ title: "Task name is required." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/tasks/${taskId}` : "/api/tasks", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          // datetime-local has no timezone, so convert here in the browser.
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : "",
          priority: priority.toUpperCase(), // "Med" -> "MED"
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setFormError(data.message || "Something went wrong. Try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <BackLink title={editing ? "Edit Task" : "Add New Task"} />
      <div className="flex justify-center pt-12 px-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-md bg-white rounded-lg border p-8"
        >
          <h2 className="font-semibold text-lg mb-6">
            {editing ? "Edit your task" : "Create a Task"}
          </h2>

          <Field label="Task Name" htmlFor="title" error={errors.title}>
            <input
              id="title"
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Exam Preparation"
              className={`${inputClass} ${errors.title ? "border-rose-400" : ""}`}
            />
          </Field>

          <Field label="Subject" htmlFor="subject" error={errors.subject}>
            <input
              id="subject"
              value={form.subject}
              onChange={update("subject")}
              placeholder="e.g. Programming, Web Development, etc."
              className={inputClass}
            />
          </Field>

          <Field label="Due Date" htmlFor="dueAt" error={errors.dueAt}>
            <input
              id="dueAt"
              type="datetime-local"
              value={form.dueAt}
              onChange={update("dueAt")}
              // The server and browser can be in different timezones when editing.
              suppressHydrationWarning
              className={`${inputClass} ${errors.dueAt ? "border-rose-400" : ""}`}
            />
          </Field>

          <p className="block text-sm font-medium mb-2">Priority</p>
          <div className="flex gap-2 mb-4">
            {Object.keys(priorityStyles).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`text-xs px-3 py-1.5 rounded-full border ${priorityStyles[p].bg} ${priorityStyles[p].text} ${
                  priority === p
                    ? priorityStyles[p].border + " ring-2 ring-offset-1"
                    : "border-transparent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Field label="Notes" htmlFor="notes" error={errors.notes}>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Optional notes about this task..."
              className={inputClass}
            />
          </Field>

          {formError && (
            <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-md bg-neutral-100 text-sm hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Saving..." : editing ? "Save Changes" : "Save Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}