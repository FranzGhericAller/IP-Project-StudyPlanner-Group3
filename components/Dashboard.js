"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { eventTypeStyles, priorityStyles } from "@/lib/data";
import { addDays } from "@/lib/calendar";
import SyncBar from "@/components/SyncBar";

// The calendar depends on the browser's timezone, so it is only rendered in the browser.
const Calendar = dynamic(() => import("@/components/Calendar"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg border p-6 text-sm text-inksoft">Loading calendar...</div>
  ),
});

// Small helper: send JSON to an API route and report whether it worked.
async function call(url, method, body) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { message: "Could not reach the server." } };
  }
}

export default function Dashboard({ tasks, stats, calendarItems }) {
  const router = useRouter();
  const [view, setView] = useState("weekly");
  const [cursor, setCursor] = useState(() => new Date());

  const [quickTitle, setQuickTitle] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [listError, setListError] = useState("");

  const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Move the calendar one week (weekly view) or one month (monthly view).
  function shift(direction) {
    setCursor((c) =>
      view === "weekly"
        ? addDays(c, 7 * direction)
        : new Date(c.getFullYear(), c.getMonth() + direction, 1)
    );
  }

  // Sidebar input: press Enter to create a task with just a title.
  async function quickAdd(e) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    setQuickBusy(true);
    setListError("");
    const { ok, data } = await call("/api/tasks", "POST", {
      title,
      subject: "",
      dueAt: "",
      priority: "MED",
      notes: "",
    });
    setQuickBusy(false);

    if (!ok) {
      setListError(data.errors?.title || data.message || "Could not add the task.");
      return;
    }
    setQuickTitle("");
    router.refresh(); // re-runs the server page so the new task appears
  }

  async function toggleTask(t) {
    setBusyId(t.id);
    setListError("");
    const { ok, data } = await call(`/api/tasks/${t.id}`, "PATCH", {
      status: t.done ? "TODO" : "DONE",
    });
    setBusyId(null);

    if (!ok) {
      setListError(data.message || "Could not update the task.");
      return;
    }
    router.refresh();
  }

  async function deleteTask(t) {
    if (!window.confirm(`Delete "${t.name}"?`)) return;

    setBusyId(t.id);
    setListError("");
    const { ok, data } = await call(`/api/tasks/${t.id}`, "DELETE");
    setBusyId(null);

    if (!ok) {
      setListError(data.message || "Could not delete the task.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9]">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Study Planner</h1>
          <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Synced with Google Calendar
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous"
            className="h-8 w-8 rounded-md border text-inksoft hover:bg-neutral-50"
          >
            ‹
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="h-8 px-3 rounded-md border text-sm hover:bg-neutral-50"
          >
            Today
          </button>
          <button
            onClick={() => shift(1)}
            aria-label="Next"
            className="h-8 w-8 rounded-md border text-inksoft hover:bg-neutral-50"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              onClick={() => setView("weekly")}
              className={`px-3 py-1.5 ${view === "weekly" ? "bg-neutral-900 text-white" : "bg-white text-inksoft"}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`px-3 py-1.5 ${view === "monthly" ? "bg-neutral-900 text-white" : "bg-white text-inksoft"}`}
            >
              Monthly
            </button>
          </div>
          <button className="h-8 px-3 rounded-md border text-sm flex items-center gap-1 text-inksoft hover:bg-neutral-50">
            ⌂ Navigator
          </button>
          <div className="h-8 w-8 rounded-full bg-violet-300" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-white p-5 space-y-6 overflow-y-auto">
          <div>
            <h2 className="font-semibold mb-3">Task Manager</h2>
            <form onSubmit={quickAdd}>
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                disabled={quickBusy}
                maxLength={191}
                placeholder="+ Add new task... (press Enter)"
                aria-label="Quick add task"
                className="w-full border rounded-[10px] px-3 py-2 text-sm mb-3 placeholder:text-inksoft disabled:opacity-60"
              />
            </form>
            <div className="flex gap-2 mb-3">
              {Object.keys(priorityStyles).map((p) => (
                <span
                  key={p}
                  className={`text-xs px-2.5 py-1 rounded-full border ${priorityStyles[p].bg} ${priorityStyles[p].text} ${priorityStyles[p].border}`}
                >
                  {p}
                </span>
              ))}
            </div>

            {listError && (
              <div className="mb-3 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                {listError}
              </div>
            )}

            {tasks.length === 0 ? (
              <p className="text-sm text-inksoft">No tasks yet. Add your first one above.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center gap-2 text-sm ${busyId === t.id ? "opacity-50" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(t)}
                      disabled={busyId === t.id}
                      aria-label={t.done ? "Mark as not done" : "Mark as done"}
                      title={t.done ? "Mark as not done" : "Mark as done"}
                      className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                        t.done
                          ? "border-emerald-500 bg-emerald-500"
                          : priorityStyles[t.priority].border
                      }`}
                    />
                    <span className={`min-w-0 flex-1 ${t.done ? "text-inksoft line-through" : ""}`}>
                      <span className="block truncate">{t.name}</span>
                      {t.subject && (
                        <span className="block truncate text-xs text-inksoft">{t.subject}</span>
                      )}
                    </span>
                    <Link
                      href={`/tasks/${t.id}/edit`}
                      aria-label={`Edit ${t.name}`}
                      title="Edit"
                      className="text-inksoft hover:text-blue-600"
                    >
                      ✎
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteTask(t)}
                      disabled={busyId === t.id}
                      aria-label={`Delete ${t.name}`}
                      title="Delete"
                      className="text-inksoft hover:text-rose-600"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/tasks/new"
              className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
            >
              + Add Task
            </Link>
          </div>
          <div>
            <h2 className="font-semibold mb-3">Resource Center</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 bg-blue-50 rounded-md px-3 py-2 text-sm">
                <span className="h-4 w-4 rounded-full bg-white border" /> Google Drive
              </li>
              <li className="flex items-center gap-2 bg-neutral-100 rounded-md px-3 py-2 text-sm">
                <span className="h-4 w-4 rounded-full bg-white border" /> Notion
              </li>
              <li className="flex items-center gap-2 bg-orange-50 rounded-md px-3 py-2 text-sm">
                <span className="h-4 w-4 rounded-full bg-white border" /> Local Files
              </li>
            </ul>
            <Link href="/resources" className="block mt-3 text-center text-sm text-blue-600 hover:underline">
              Open Resource Center
            </Link>
          </div>
          <div>
            <h2 className="font-semibold mb-3">Progress</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-inksoft">Hours logged</span>
                <span className="font-medium">{(stats.minutes / 60).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-inksoft">Completed tasks</span>
                <span className="font-medium">
                  {stats.completed} / {stats.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-inksoft">Upcoming deadlines</span>
                <span className="font-medium">{stats.upcoming}</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 mt-2">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <Link
              href="/study/new"
              className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
            >
              + Log study time
            </Link>
          </div>
          <Link
            href="/settings"
            className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
          >
            Profile & Settings
          </Link>
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-inksoft">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${eventTypeStyles.gcal.dot}`} />
              Synced GCal Event
            </span>
            <span>Task due:</span>
            {Object.keys(priorityStyles).map((p) => (
              <span
                key={p}
                className={`px-2 py-0.5 rounded-full border ${priorityStyles[p].bg} ${priorityStyles[p].text} ${priorityStyles[p].border}`}
              >
                {p}
              </span>
            ))}
            <Link
              href="/events/new"
              className="ml-auto h-8 px-3 rounded-md border bg-white text-sm text-ink flex items-center hover:bg-neutral-50"
            >
              + Add Event
            </Link>
          </div>
          <Calendar items={calendarItems} view={view} cursor={cursor} />
        </main>
      </div>
      <SyncBar />
    </div>
  );
}