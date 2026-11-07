"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormPage from "@/components/forms/FormPage";
import Field from "@/components/forms/Field";
import { callApi } from "@/lib/callApi";
import { inputClass } from "@/lib/ui";

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

    setLoading(true);
    const { ok, data } = await callApi("/api/events", "POST", {
      title: form.title,
      subject: form.subject,
      description: form.description,
      // datetime-local has no timezone, so convert to ISO here in the browser
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
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
      pageTitle="Add New Event"
      heading="Create an Event"
      onSubmit={handleSubmit}
      error={formError}
      loading={loading}
      submitLabel="Save Event"
    >
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
    </FormPage>
  );
}
