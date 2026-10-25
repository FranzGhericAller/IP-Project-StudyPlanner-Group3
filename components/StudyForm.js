"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import Field from "@/components/auth/Field";

const inputClass =
  "w-full border rounded-[10px] px-3 py-2 text-sm placeholder:text-inksoft";

// `tasks` is a list of { id, title } the user can link the session to.
export default function StudyForm({ tasks }) {
  const router = useRouter();
  const [form, setForm] = useState({
    minutes: "",
    subject: "",
    taskId: "",
    startedAt: "",
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

    const minutes = Number(form.minutes);
    if (!form.minutes || !Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setErrors({ minutes: "Enter whole minutes between 1 and 1440." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutes,
          subject: form.subject,
          taskId: form.taskId,
          // Blank means "now" on the server.
          startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : "",
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
      <BackLink title="Log Study Time" />
      <div className="flex justify-center pt-12 px-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-md bg-white rounded-lg border p-8"
        >
          <h2 className="font-semibold text-lg mb-6">How long did you study?</h2>

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
            <select
              id="taskId"
              value={form.taskId}
              onChange={update("taskId")}
              className={inputClass}
            >
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
              {loading ? "Saving..." : "Log Time"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}