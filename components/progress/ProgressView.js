"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@/components/common/Alert";
import { callApi } from "@/lib/callApi";
import { formatMinutes } from "@/lib/format";
import { inputClass } from "@/lib/ui";

const CARD =
  "rounded-[15px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5";

const RANGES = [
  ["week", "This week"],
  ["month", "This month"],
  ["all", "All time"],
];

// circular progress. percent is capped at 100 for the drawing
function Ring({ percent, reached }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const shown = Math.min(100, Math.max(0, percent));
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="9"
        className="stroke-neutral-200 dark:stroke-neutral-800"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - shown / 100)}
        className={reached ? "stroke-emerald-500" : "stroke-blue-600 dark:stroke-blue-500"}
      />
    </svg>
  );
}

// data comes from app/(app)/progress/page.js
export default function ProgressView({ data }) {
  const [goalMin, setGoalMin] = useState(data.goalMin);
  const [editing, setEditing] = useState(false);
  const [goalHours, setGoalHours] = useState(String(data.goalMin / 60));
  const [goalError, setGoalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState("week");

  const percent = goalMin > 0 ? Math.round((data.weekMinutes / goalMin) * 100) : 0;
  const reached = percent >= 100;
  const left = Math.max(0, goalMin - data.weekMinutes);

  async function saveGoal(e) {
    e.preventDefault();
    setGoalError("");

    const hours = Number(goalHours);
    if (!Number.isFinite(hours) || hours < 0.5 || hours > 100) {
      setGoalError("Enter a goal between 0.5 and 100 hours.");
      return;
    }

    setSaving(true);
    const minutes = Math.round(hours * 60);
    const { ok, data: res } = await callApi("/api/settings", "PATCH", { weeklyGoalMin: minutes });
    setSaving(false);

    if (!ok) {
      setGoalError(res.errors?.weeklyGoalMin || res.message || "Could not save the goal.");
      return;
    }
    setGoalMin(minutes);
    setEditing(false);
  }

  // subjects for the chosen range, most studied first
  const rows = useMemo(
    () =>
      data.subjects
        .map((s) => ({ name: s.name, minutes: s.minutes[range], tasks: s.tasks[range] }))
        .filter((r) => r.minutes > 0 || r.tasks > 0)
        .sort((a, b) => b.minutes - a.minutes || b.tasks - a.tasks || a.name.localeCompare(b.name)),
    [data.subjects, range]
  );
  const maxSubject = Math.max(1, ...rows.map((r) => r.minutes));
  const maxDay = Math.max(60, ...data.days.map((d) => d.minutes));

  const streakNote = data.studiedToday
    ? "You studied today. Nice."
    : data.currentStreak > 0
    ? "Study today to keep your streak."
    : "Study today to start a streak.";

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      {data.totalMinutes === 0 && (
        <div className={CARD}>
          <h2 className="font-semibold">Nothing logged yet</h2>
          <p className="mt-1 text-sm text-inksoft">
            Start the Study timer on the dashboard, or log time by hand. Your goal, streak and charts fill in
            as you study.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Go to dashboard
          </Link>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* weekly goal */}
        <section className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Weekly goal</h2>
            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setGoalHours(String(goalMin / 60));
                  setGoalError("");
                  setEditing(true);
                }}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Change goal
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-5">
            <div className="relative shrink-0">
              <Ring percent={percent} reached={reached} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold">{percent}%</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold">{formatMinutes(data.weekMinutes)}</p>
              <p className="text-sm text-inksoft">of {formatMinutes(goalMin)} this week</p>
              <p
                className={`mt-2 text-sm ${
                  reached ? "text-emerald-600 dark:text-emerald-400" : "text-inksoft"
                }`}
              >
                {reached ? "Goal reached. Great work!" : `${formatMinutes(left)} to go`}
              </p>
            </div>
          </div>

          {editing && (
            <form onSubmit={saveGoal} className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <label htmlFor="goal" className="block text-sm font-medium">
                Hours per week
              </label>
              <input
                id="goal"
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                className={inputClass}
              />
              <Alert>{goalError}</Alert>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save goal"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* streak */}
        <section className={CARD}>
          <h2 className="font-semibold">Study streak</h2>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-semibold leading-none">{data.currentStreak}</span>
            <span className="pb-1 text-inksoft">{data.currentStreak === 1 ? "day" : "days"}</span>
          </div>
          <p className="mt-3 text-sm text-inksoft">{streakNote}</p>
          <p className="mt-4 text-sm">
            <span className="text-inksoft">Best streak: </span>
            <span className="font-medium">
              {data.bestStreak} {data.bestStreak === 1 ? "day" : "days"}
            </span>
          </p>
          <p className="mt-1 text-xs text-inksoft">A day counts when you log at least 1 minute.</p>
        </section>
      </div>

      {/* this week by day */}
      <section className={CARD}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">This week</h2>
          <span className="text-xs text-inksoft">{data.weekLabel}</span>
        </div>

        <div className="mt-4 flex gap-2">
          {data.days.map((d) => {
            const height = d.minutes > 0 ? Math.max(4, (d.minutes / maxDay) * 100) : 0;
            return (
              <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="h-4 text-[11px] text-inksoft">{d.minutes > 0 ? formatMinutes(d.minutes) : ""}</span>
                <div className="flex h-32 w-full items-end justify-center">
                  {d.minutes > 0 ? (
                    <div
                      className={`w-full max-w-[36px] rounded-t-md ${
                        d.isToday ? "bg-blue-600 dark:bg-blue-500" : "bg-blue-300 dark:bg-blue-800"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ) : (
                    <div className="h-0.5 w-full max-w-[36px] rounded bg-neutral-200 dark:bg-neutral-800" />
                  )}
                </div>
                <span
                  className={`text-xs ${
                    d.isToday ? "font-semibold text-blue-700 dark:text-blue-300" : "text-inksoft"
                  }`}
                >
                  {d.label}
                </span>
                <span className="text-[10px] text-inksoft">{d.day}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* hours per subject */}
      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Hours per subject</h2>
          <div className="flex overflow-hidden rounded-md border border-neutral-300 text-sm dark:border-neutral-700">
            {RANGES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                aria-pressed={range === key}
                className={`px-3 py-1.5 ${
                  range === key
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-white text-inksoft dark:bg-neutral-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-inksoft">No study time or finished tasks in this range yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {rows.map((r) => (
              <li key={r.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{r.name}</span>
                  <span className="shrink-0">{formatMinutes(r.minutes)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${(r.minutes / maxSubject) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-inksoft">
                  {r.tasks} {r.tasks === 1 ? "task" : "tasks"} completed
                </p>
              </li>
            ))}
          </ul>
        )}

        {rows.some((r) => r.name === "No subject") && (
          <p className="mt-4 text-xs text-inksoft">
            &quot;No subject&quot; is time and tasks without a subject. Add one when you create a task to see it
            grouped here.
          </p>
        )}
      </section>
    </div>
  );
}