"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import Field from "@/components/auth/Field";

const inputClass =
  "w-full border rounded-[10px] px-3 py-2 text-sm placeholder:text-inksoft";

export default function EventForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    subject: "",
    startAt: "",
    endAt: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.startAt) next.startAt = "Pick a start time.";
    if (!form.endAt) next.endAt = "Pick an end time.";
    if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      next.endAt = "End must be after the start.";
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          description: form.description,
          // datetime-local has no timezone, so convert here in the browser.
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
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
      <BackLink title="Add New Event" />
      <div className="flex justify-center pt-12 px-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-md bg-white rounded-lg border p-8"
        >
          <h2 className="font-semibold text-lg mb-6">Create an Event</h2>

          <Field label="Title" htmlFor="title" error={errors.title}>
            <input
              id="title"
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Midterm Exam"
              className={`${inputClass} ${errors.title ? "border-rose-400" : ""}`}
            />
          </Field>

          <Field label="Subject (optional)" htmlFor="subject" error={errors.subject}>
            <input
              id="subject"
              value={form.subject}
              onChange={update("subject")}
              placeholder="e.g. Systems Review"
              className={inputClass}
            />
          </Field>

          <Field label="Starts" htmlFor="startAt" error={errors.startAt}>
            <input
              id="startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={update("startAt")}
              className={`${inputClass} ${errors.startAt ? "border-rose-400" : ""}`}
            />
          </Field>

          <Field label="Ends" htmlFor="endAt" error={errors.endAt}>
            <input
              id="endAt"
              type="datetime-local"
              value={form.endAt}
              onChange={update("endAt")}
              className={`${inputClass} ${errors.endAt ? "border-rose-400" : ""}`}
            />
          </Field>

          <Field label="Description (optional)" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={update("description")}
              placeholder="Room, topics, reminders..."
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
              {loading ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}