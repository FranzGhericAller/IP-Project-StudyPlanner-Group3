"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleBadge from "@/components/common/GoogleBadge";
import Alert from "@/components/common/Alert";
import { callApi } from "@/lib/callApi";
import { inputClass, priorityLabels, priorityStyles } from "@/lib/ui";
import { useStudyTimer } from "@/components/study/StudyTimerProvider";

const MAX_MB = 10;

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const dt = (iso) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

export default function DetailPanel({ target, onClose }) {
  const router = useRouter();
  const timer = useStudyTimer();
  const [timerError, setTimerError] = useState("");

  async function startStudying() {
    setTimerError("");
    const res = await timer.start({ taskId: target.id });
    if (!res.ok) setTimerError(res.message);
  }

  const isTask = target.kind === "task";
  const api = `/api/${isTask ? "tasks" : "events"}/${target.id}`;
  const noteField = isTask ? "notes" : "description";

  const [item, setItem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState("");
  const [resources, setResources] = useState([]);

  const [showDrive, setShowDrive] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveTitle, setDriveTitle] = useState("");
  const [driveError, setDriveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    callApi(api, "GET").then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) {
        setLoadError(data.message || "Could not load the details.");
        return;
      }
      const loaded = data.task ?? data.event;
      setItem(loaded);
      setNotes(loaded[noteField] ?? "");
      setResources(loaded.resources ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [api, noteField]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function saveNotes() {
    if (!item) return;
    if (notes.trim() === (item[noteField] ?? "").trim()) return;

    setSaveState("saving");
    const { ok } = await callApi(`${api}/notes`, "PUT", { notes });
    if (!ok) {
      setSaveState("error");
      return;
    }
    setItem({ ...item, [noteField]: notes.trim() });
    setSaveState("saved");
  }

  async function addDriveLink(e) {
    e.preventDefault();
    setDriveError("");
    const { ok, data } = await callApi("/api/resources", "POST", {
      targetType: target.kind,
      targetId: target.id,
      url: driveUrl,
      title: driveTitle,
    });
    if (!ok) {
      setDriveError(data.errors?.url || data.errors?.title || data.message || "Could not add the link.");
      return;
    }
    setResources([data.resource, ...resources]);
    setDriveUrl("");
    setDriveTitle("");
    setShowDrive(false);
  }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileError("");
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File is too large (max ${MAX_MB} MB).`);
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("targetType", target.kind);
    form.append("targetId", target.id);
    try {
      const res = await fetch("/api/resources/upload", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFileError(body.errors?.file || body.message || "Upload failed.");
        return;
      }
      setResources((list) => [body.resource, ...list]);
    } catch {
      setFileError("Could not reach the server. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function removeResource(r) {
    if (!window.confirm(`Remove "${r.title}"?`)) return;
    const { ok, data } = await callApi(`/api/resources/${r.id}`, "DELETE");
    if (!ok) {
      setFileError(data.message || "Could not remove it.");
      return;
    }
    setResources((list) => list.filter((x) => x.id !== r.id));
  }

  async function toggleDone() {
    const status = item.status === "DONE" ? "TODO" : "DONE";
    setBusy(true);
    const { ok } = await callApi(`/api/tasks/${target.id}`, "PATCH", { status });
    setBusy(false);
    if (ok) {
      setItem({ ...item, status });
      router.refresh();
    }
  }

  const linked = item && (isTask ? item.googleTaskId : item.googleEventId);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label="Details">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-black/20 dark:bg-black/50"
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-inksoft hover:text-ink"
        >
          ✕
        </button>

        {loadError && <Alert>{loadError}</Alert>}
        {!item && !loadError && <p className="text-sm text-inksoft">Loading...</p>}

        {item && (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-inksoft">
              {isTask ? "Task" : "Event"}
            </p>
            <h2
              className={`mt-1 pr-6 text-xl font-semibold ${
                item.status === "DONE" ? "line-through text-inksoft" : ""
              }`}
            >
              {item.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {isTask && (
                <span
                  className={`rounded-full border px-2.5 py-1 ${priorityStyles[item.priority].bg} ${
                    priorityStyles[item.priority].text
                  } ${priorityStyles[item.priority].border}`}
                >
                  {priorityLabels[item.priority]} priority
                </span>
              )}
              {item.subject?.name && (
                <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-neutral-700 dark:text-neutral-200">
                  {item.subject.name}
                </span>
              )}
              {linked ? <GoogleBadge /> : null}
            </div>

            <p className="mt-3 text-sm text-inksoft">
              {isTask
                ? item.dueAt
                  ? `Due ${dt(item.dueAt)}`
                  : "No due date"
                : item.allDay
                ? `${new Date(item.startAt).toLocaleDateString("en-US", { dateStyle: "medium" })} (all day)`
                : `${dt(item.startAt)} to ${new Date(item.endAt).toLocaleTimeString("en-US", {
                    timeStyle: "short",
                  })}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {isTask && (
                <button
                  type="button"
                  onClick={toggleDone}
                  disabled={busy}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {item.status === "DONE" ? "Reopen" : "Mark done"}
                </button>
              )}
              {isTask &&
                item.status !== "DONE" &&
                (timer.active?.taskId === target.id ? (
                  <button
                    type="button"
                    onClick={timer.stop}
                    disabled={timer.busy}
                    className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 disabled:opacity-60"
                  >
                    Stop · {timer.display}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startStudying}
                    disabled={Boolean(timer.active) || timer.busy}
                    title={timer.active ? "Another timer is already running" : "Start a study timer for this task"}
                    className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Start studying
                  </button>
                ))}
              <Link
                href={isTask ? `/tasks/${target.id}/edit` : `/events/${target.id}/edit`}
                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Edit details
              </Link>
            </div>

            {timerError && (
              <div className="mt-2">
                <Alert>{timerError}</Alert>
              </div>
            )}

            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="panel-notes" className="text-sm font-semibold">
                  Notes
                </label>
                <span className="text-xs text-inksoft">
                  {saveState === "saving" && "Saving..."}
                  {saveState === "saved" && "Saved"}
                  {saveState === "error" && (
                    <span className="text-rose-600 dark:text-rose-400">Could not save</span>
                  )}
                </span>
              </div>
              <textarea
                id="panel-notes"
                rows={5}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaveState("");
                }}
                onBlur={saveNotes}
                maxLength={5000}
                placeholder="Steps, topics to review, reminders..."
                className={inputClass}
              />
              {linked ? <p className="mt-1 text-xs text-inksoft">Notes are also saved in Google.</p> : null}
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">Resources</h3>

              {resources.length === 0 ? (
                <p className="text-sm text-inksoft">
                  Nothing attached yet. Add a Google Drive link or upload a file you need for this {target.kind}.
                </p>
              ) : (
                <ul className="space-y-2">
                  {resources.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm"
                    >
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          r.provider === "DRIVE"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {r.provider === "DRIVE" ? "Drive" : "File"}
                      </span>
                      <a
                        href={r.provider === "LOCAL" ? `/api/resources/${r.id}/file` : r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-blue-700 dark:text-blue-400 hover:underline"
                        title={r.title}
                      >
                        {r.title}
                      </a>
                      {r.sizeBytes ? (
                        <span className="shrink-0 text-xs text-inksoft">{formatSize(r.sizeBytes)}</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeResource(r)}
                        aria-label={`Remove ${r.title}`}
                        className="shrink-0 text-inksoft hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowDrive(!showDrive)}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  + Google Drive link
                </button>
                <label
                  className={`cursor-pointer rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                    uploading ? "opacity-60" : ""
                  }`}
                >
                  {uploading ? "Uploading..." : "+ Upload file"}
                  <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} />
                </label>
              </div>

              {showDrive && (
                <form
                  onSubmit={addDriveLink}
                  className="mt-3 space-y-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 p-3"
                >
                  <input
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="Paste a Google Drive or Docs link"
                    aria-label="Google Drive link"
                    className={inputClass}
                  />
                  <input
                    value={driveTitle}
                    onChange={(e) => setDriveTitle(e.target.value)}
                    maxLength={150}
                    placeholder="Name (optional)"
                    aria-label="Name"
                    className={inputClass}
                  />
                  <Alert>{driveError}</Alert>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add link
                  </button>
                </form>
              )}

              <div className="mt-2">
                <Alert>{fileError}</Alert>
              </div>
              <p className="mt-2 text-xs text-inksoft">
                Files up to {MAX_MB} MB: PDF, Office files, images, text, zip. Drive files follow Google&apos;s
                sharing settings.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}