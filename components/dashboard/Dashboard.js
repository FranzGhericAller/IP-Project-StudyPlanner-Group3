"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import TaskList from "@/components/dashboard/TaskList";
import SyncBar from "@/components/dashboard/SyncBar";
import DetailPanel from "@/components/dashboard/DetailPanel";
import TimerCard from "@/components/study/TimerCard";
import UserAvatar from "@/components/common/UserAvatar";
import { addDays, sameDay } from "@/lib/calendar";
import GoogleBadge from "@/components/common/GoogleBadge";
import ResourceBadge, { resourceHref } from "@/components/common/ResourceBadge";
import { eventStyle, priorityLabels, priorityStyles } from "@/lib/ui";
import { formatMinutes } from "@/lib/format";

const Calendar = dynamic(() => import("@/components/dashboard/Calendar"), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 text-sm text-inksoft">
      Loading calendar...
    </div>
  ),
});

function FilterPill({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        on
          ? "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-ink"
          : "border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-400 dark:text-neutral-500 line-through"
      }`}
    >
      {children}
    </button>
  );
}

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

export default function Dashboard({
  tasks,
  completedTasks,
  stats,
  calendarItems,
  recentResources = [],
  resourceCount = 0,
  weekly = { goalMin: 600, weekMinutes: 0, percent: 0, currentStreak: 0, studiedToday: false },
}) {
  const [view, setView] = useState("weekly");
  const [cursor, setCursor] = useState(() => new Date());
  const [show, setShow] = useState({ tasks: true, events: true, study: true });
  const [selected, setSelected] = useState(null);
  const [mobileTab, setMobileTab] = useState("calendar"); // phones only: "calendar" | "tasks"
  const [todayMin, setTodayMin] = useState(0);

  // minutes studied today. done in the browser so "today" matches the user's timezone
  useEffect(() => {
    const now = new Date();
    setTodayMin(
      calendarItems
        .filter((i) => i.kind === "study" && sameDay(new Date(i.at), now))
        .reduce((sum, i) => sum + (i.minutes || 0), 0)
    );
  }, [calendarItems]);

  const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const visibleItems = calendarItems.filter((i) =>
    i.kind === "task" ? show.tasks : i.kind === "event" ? show.events : show.study
  );

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
      className={`px-3 py-1.5 ${
        view === name
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "bg-white dark:bg-neutral-900 text-inksoft"
      }`}
    >
      {label}
    </button>
  );

  const switchClass =
    "rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden text-sm";
  const navBtn =
    "h-9 w-9 md:h-8 md:w-8 rounded-md border border-neutral-300 dark:border-neutral-700 text-inksoft hover:bg-neutral-50 dark:hover:bg-neutral-800";

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar. phone: title + avatar on row 1, navigation + view switch on row 2 */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 md:px-6 md:py-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
        <h1 className="order-1 text-xl font-semibold">Study Planner</h1>

        <div className="order-2 md:order-3 flex items-center gap-3">
          <Link
            href="/today"
            className="h-8 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm text-ink flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Today view
          </Link>
          <div className={`hidden md:flex ${switchClass}`}>
            {viewButton("weekly", "Weekly")}
            {viewButton("monthly", "Monthly")}
          </div>
          <Link href="/settings" aria-label="Profile & Settings">
            <UserAvatar />
          </Link>
        </div>

        <div className="order-3 md:order-2 flex w-full md:w-auto items-center justify-between md:justify-start gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => shift(-1)} aria-label="Previous" className={navBtn}>
              ‹
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="h-9 md:h-8 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Today
            </button>
            <button onClick={() => shift(1)} aria-label="Next" className={navBtn}>
              ›
            </button>
          </div>

          <div className={`flex md:hidden ${switchClass}`}>
            {viewButton("weekly", "Weekly")}
            {viewButton("monthly", "Monthly")}
          </div>
        </div>
      </header>

      {/* phone only: switch between the calendar and the task sidebar */}
      <div
        className="md:hidden flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
        role="tablist"
      >
        {[
          ["calendar", "Calendar"],
          ["tasks", `Tasks (${tasks.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mobileTab === key}
            onClick={() => setMobileTab(key)}
            className={`flex-1 py-2.5 font-medium ${
              mobileTab === key
                ? "border-b-2 border-neutral-900 dark:border-neutral-100 text-ink"
                : "text-inksoft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 md:overflow-hidden">
        {/* sidebar. phone: shown only on the Tasks tab, full width */}
        <aside
          className={`${
            mobileTab === "tasks" ? "block" : "hidden"
          } w-full md:block md:w-72 md:shrink-0 border-neutral-200 dark:border-neutral-800 md:border-r bg-white dark:bg-neutral-900 p-4 md:p-5 space-y-6 md:overflow-y-auto`}
        >
          <TaskList
            tasks={tasks}
            completedTasks={completedTasks}
            onOpen={(task) => setSelected({ kind: "task", id: task.id })}
          />

          <TimerCard tasks={tasks} todayMinutes={todayMin} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Resource Center</h2>
              {resourceCount > 0 && <span className="text-xs text-inksoft">{resourceCount}</span>}
            </div>

            {recentResources.length === 0 ? (
              <p className="text-sm text-inksoft">
                Open a task or event and attach a Drive link or file. It will show up here.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentResources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={resourceHref(r)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-md bg-neutral-50 dark:bg-neutral-800 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <ResourceBadge provider={r.provider} />
                      <span className="truncate">{r.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/resources"
              className="block mt-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open Resource Center
            </Link>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Progress</h2>

            {/* weekly goal + streak. details are on the Progress page */}
            <div className="mb-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-inksoft">Weekly goal</span>
                <span className="font-medium">
                  {formatMinutes(weekly.weekMinutes)} / {formatMinutes(weekly.goalMin)}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className={`h-1.5 rounded-full ${
                    weekly.percent >= 100 ? "bg-emerald-500" : "bg-blue-600 dark:bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, weekly.percent)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-inksoft">
                {weekly.currentStreak > 0
                  ? `${weekly.currentStreak}-day streak${weekly.studiedToday ? "" : ". Study today to keep it."}`
                  : "Study today to start a streak."}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-inksoft">Hours logged</span>
                <span className="font-medium">{(stats.minutes / 60).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-inksoft">Upcoming deadlines</span>
                <span className="font-medium">{stats.upcoming}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-inksoft">Completed tasks</span>
                <span className="font-medium">
                  {stats.completed} / {stats.total}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 mt-2">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
              </div>
            </div>

            <Link
              href="/progress"
              className="block mt-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View progress details
            </Link>
            <Link
              href="/study/new"
              className="block mt-3 text-center text-sm border border-neutral-300 dark:border-neutral-700 rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              + Log study time
            </Link>
          </div>

          <Link
            href="/settings"
            className="block text-center text-sm border border-neutral-300 dark:border-neutral-700 rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Profile & Settings
          </Link>
        </aside>

        {/* calendar. phone: shown only on the Calendar tab */}
        <main
          className={`${
            mobileTab === "calendar" ? "block" : "hidden"
          } md:block min-w-0 flex-1 overflow-auto p-4 md:p-6`}
        >
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-inksoft">
            <FilterPill on={show.tasks} onClick={() => setShow({ ...show, tasks: !show.tasks })}>
              <span className="h-2.5 w-2.5 rounded-full border-2 border-current" />
              Tasks
            </FilterPill>
            <FilterPill on={show.events} onClick={() => setShow({ ...show, events: !show.events })}>
              <span className={`h-3 border-l-4 ${eventStyle.accent}`} />
              Events
            </FilterPill>
            <FilterPill on={show.study} onClick={() => setShow({ ...show, study: !show.study })}>
              <span className="h-2.5 w-3.5 rounded-sm border border-dashed border-current" />
              Study
            </FilterPill>

            <span className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            <span>Task priority:</span>
            <PriorityLegend />

            <span className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            <span className="flex items-center gap-1.5">
              <GoogleBadge /> synced with Google
            </span>

            <Link
              href="/events/new"
              className="ml-auto h-8 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-ink flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              + Add Event
            </Link>
          </div>
          <Calendar
            items={visibleItems}
            view={view}
            cursor={cursor}
            onSelect={(item) => {
              if (item.kind === "study") return; // logged time has no details panel
              setSelected({ kind: item.kind, id: item.refId });
            }}
          />
        </main>
      </div>

      {selected && (
        <DetailPanel
          key={`${selected.kind}-${selected.id}`}
          target={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <SyncBar />
    </div>
  );
}