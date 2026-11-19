"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormPage from "@/components/forms/FormPage";
import Field from "@/components/forms/Field";
import { callApi } from "@/lib/callApi";
import { inputClass } from "@/lib/ui";

// ISO date -> "2026-10-25T09:00" (local time), the format datetime-local inputs need
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Add event (no props) or Edit event (eventId + initial values)
// linked = this event also exists in Google Calendar, allDay = Google all-day event
export default function EventForm({ eventId, initial, linked = false, allDay = false }) {
  const editing = Boolean(eventId);
  const router = useRouter();

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    subject: initial?.subject ?? "",
    startAt: toLocalInput(initial?.startAt),
    endAt: toLocalInput(initial?.endAt),
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  // quick checks here, the API checks again w/ zod
  function validate() {
    const found = {};
    if (!form.title.trim()) found.title = "Title is required.";
    if (!form.startAt) found.startAt = "Pick a start time.";
    if (!form.endAt) found.endAt = "Pick an end time.";
    if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      found.endAt = "End must be after the start.";
    }
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    // edit = PUT /api/events/:id, add = POST /api/events
    setLoading(true);
    const { ok, data } = await callApi(
      editing ? `/api/events/${eventId}` : "/api/events",
      editing ? "PUT" : "POST",
      {
        title: form.title,
        subject: form.subject,
        description: form.description,
        // datetime-local has no timezone, so convert to ISO here in the browser
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
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

  async function handleDelete() {
    const extra = linked ? " It will also be deleted from Google Calendar." : "";
    if (!window.confirm(`Delete "${form.title}"?${extra}`)) return;

    setDeleting(true);
    setFormError("");
    const { ok, data } = await callApi(`/api/events/${eventId}`, "DELETE");
    setDeleting(false);

    if (!ok) {
      setFormError(data.message || "Could not delete the event.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <FormPage
      pageTitle={editing ? "Edit Event" : "Add New Event"}
      heading={editing ? "Edit your event" : "Create an Event"}
      onSubmit={handleSubmit}
      error={formError}
      loading={loading}
      submitLabel={editing ? "Save Changes" : "Save Event"}
    >
      {editing && allDay && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          This is an all-day event from Google Calendar. Changes made here are saved in the planner
          only and are not sent to Google.
        </p>
      )}
      {editing && linked && !allDay && (
        <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          This event is linked to Google Calendar. Saving also updates it there.
        </p>
      )}

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
          suppressHydrationWarning // server and browser timezones can differ
          className={`${inputClass} ${errors.startAt ? "border-rose-400" : ""}`}
        />
      </Field>

      <Field label="Ends" htmlFor="endAt" error={errors.endAt}>
        <input
          id="endAt"
          type="datetime-local"
          value={form.endAt}
          onChange={update("endAt")}
          suppressHydrationWarning
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

      {editing && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || loading}
          className="mt-2 w-full rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete event"}
        </button>
      )}
    </FormPage>
  );
}