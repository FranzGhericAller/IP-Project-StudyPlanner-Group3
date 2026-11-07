"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormPage from "@/components/forms/FormPage";
import Field from "@/components/forms/Field";
import { callApi } from "@/lib/callApi";
import { inputClass, priorityLabels, priorityStyles } from "@/lib/ui";

// ISO date -> "2026-10-25T09:00" (local time), the format datetime-local inputs need
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Add task (no props) or Edit task (taskId + initial values)
export default function TaskForm({ taskId, initial }) {
  const editing = Boolean(taskId);
  const router = useRouter();

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    subject: initial?.subject ?? "",
    dueAt: toLocalInput(initial?.dueAt),
    priority: initial?.priority ?? "MED",
    notes: initial?.notes ?? "",
  });
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

    // edit = PUT /api/tasks/:id, add = POST /api/tasks
    setLoading(true);
    const { ok, data } = await callApi(
      editing ? `/api/tasks/${taskId}` : "/api/tasks",
      editing ? "PUT" : "POST",
      {
        ...form,
        // datetime-local has no timezone, so convert to ISO here in the browser
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : "",
      }
    );
    setLoading(false);

    if (!ok) {
      if (data.errors) setErrors(data.errors);
      else setFormError(data.message || "Something went wrong. Try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <FormPage
      pageTitle={editing ? "Edit Task" : "Add New Task"}
      heading={editing ? "Edit your task" : "Create a Task"}
      onSubmit={handleSubmit}
      error={formError}
      loading={loading}
      submitLabel={editing ? "Save Changes" : "Save Task"}
    >
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
          suppressHydrationWarning // server and browser timezones can differ
          className={`${inputClass} ${errors.dueAt ? "border-rose-400" : ""}`}
        />
      </Field>

      <p className="block text-sm font-medium mb-2">Priority</p>
      <div className="flex gap-2 mb-4">
        {Object.keys(priorityStyles).map((p) => {
          const style = priorityStyles[p];
          const selected = form.priority === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setForm({ ...form, priority: p })}
              className={`text-xs px-3 py-1.5 rounded-full border ${style.bg} ${style.text} ${
                selected ? `${style.border} ring-2 ring-offset-1` : "border-transparent"
              }`}
            >
              {priorityLabels[p]}
            </button>
          );
        })}
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
    </FormPage>
  );
}
