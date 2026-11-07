"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import TaskList from "@/components/dashboard/TaskList";
import SyncBar from "@/components/dashboard/SyncBar";
import UserAvatar from "@/components/common/UserAvatar";
import { addDays } from "@/lib/calendar";
import { eventStyles, priorityLabels, priorityStyles } from "@/lib/ui";

// calendar depends on the browser's timezone, so only render it in the browser
const Calendar = dynamic(() => import("@/components/dashboard/Calendar"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg border p-6 text-sm text-inksoft">Loading calendar...</div>
  ),
});

function PriorityLegend() {
  return Object.keys(priorityStyles).map((p) => {
    const style = priorityStyles[p];
    return (
      <span
        key={p}
        className={`text-xs px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
      >
        {priorityLabels[p]}
      </span>
    );
  });
}

// Main screen after login. Data comes from app/(app)/page.js
export default function Dashboard({ tasks, stats, calendarItems }) {
  const [view, setView] = useState("weekly"); // "weekly" | "monthly"
  const [cursor, setCursor] = useState(() => new Date()); // date the calendar is on

  const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  // move 1 week or 1 month back (-1) or forward (+1)
  function shift(direction) {
    setCursor((c) =>
      view === "weekly"
        ? addDays(c, 7 * direction)
        : new Date(c.getFullYear(), c.getMonth() + direction, 1)
    );
  }

  const viewButton = (name, label) => (
    <button
      onClick={() => setView(name)}
      className={`px-3 py-1.5 ${view === name ? "bg-neutral-900 text-white" : "bg-white text-inksoft"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
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
            {viewButton("weekly", "Weekly")}
            {viewButton("monthly", "Monthly")}
          </div>
          <Link href="/settings" aria-label="Profile & Settings">
            <UserAvatar />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className="w-72 border-r bg-white p-5 space-y-6 overflow-y-auto">
          <TaskList tasks={tasks} />

          <div>
            <h2 className="font-semibold mb-3">Resource Center</h2>
            <ul className="space-y-2 text-sm">
              <li className="bg-blue-50 rounded-md px-3 py-2">Google Drive</li>
              <li className="bg-neutral-100 rounded-md px-3 py-2">Notion</li>
              <li className="bg-orange-50 rounded-md px-3 py-2">Local Files</li>
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
            className="block text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
          >
            Profile & Settings
          </Link>
        </aside>

        {/* calendar */}
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-inksoft">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${eventStyles.gcal.dot}`} />
              Synced GCal Event
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${eventStyles.local.dot}`} />
              My Event
            </span>
            <span>Task due:</span>
            <PriorityLegend />
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
