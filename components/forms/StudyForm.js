"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormPage from "@/components/forms/FormPage";
import Field from "@/components/forms/Field";
import { callApi } from "@/lib/callApi";
import { inputClass } from "@/lib/ui";

// tasks = [{ id, title }] for the "linked task" dropdown
export default function StudyForm({ tasks }) {
  const router = useRouter();
  const [form, setForm] = useState({ minutes: "", subject: "", taskId: "", startedAt: "" });
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

    const minutes = Number(form.minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setErrors({ minutes: "Enter whole minutes between 1 and 1440." });
      return;
    }

    setLoading(true);
    const { ok, data } = await callApi("/api/study-sessions", "POST", {
      minutes,
      subject: form.subject,
      taskId: form.taskId,
      startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : "", // blank = now
    });
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
      pageTitle="Log Study Time"
      heading="How long did you study?"
      onSubmit={handleSubmit}
      error={formError}
      loading={loading}
      submitLabel="Log Time"
    >
      <Field label="Minutes studied" htmlFor="minutes" error={errors.minutes}>
        <input
          id="minutes"
          type="number"
          min="1"
          max="1440"
          value={form.minutes}
          onChange={update("minutes")}
          placeholder="e.g. 45"
          className={`${inputClass} ${errors.minutes ? "border-rose-400" : ""}`}
        />
      </Field>

      <Field label="Subject (optional)" htmlFor="subject" error={errors.subject}>
        <input
          id="subject"
          value={form.subject}
          onChange={update("subject")}
          placeholder="e.g. Web Development"
          className={inputClass}
        />
      </Field>

      <Field label="Linked task (optional)" htmlFor="taskId" error={errors.taskId}>
        <select id="taskId" value={form.taskId} onChange={update("taskId")} className={inputClass}>
          <option value="">No linked task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </Field>

      <Field label="When did you start? (optional)" htmlFor="startedAt" error={errors.startedAt}>
        <input
          id="startedAt"
          type="datetime-local"
          value={form.startedAt}
          onChange={update("startedAt")}
          className={inputClass}
        />
      </Field>
      <p className="-mt-2 mb-4 text-xs text-inksoft">Leave blank to use the current time.</p>
    </FormPage>
  );
}
