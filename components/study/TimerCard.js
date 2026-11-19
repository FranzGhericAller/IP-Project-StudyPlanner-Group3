"use client";

import { useState } from "react";
import Alert from "@/components/common/Alert";
import { useStudyTimer } from "@/components/study/StudyTimerProvider";
import { inputClass } from "@/lib/ui";

const FOCUS = [
  ["0", "Stopwatch (no limit)"],
  ["25", "Focus 25 min"],
  ["45", "Focus 45 min"],
  ["60", "Focus 60 min"],
];

// 75 -> "1h 15m"
function fmtMinutes(m) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${r}m` : `${r}m`;
}

// "Study timer" box in the sidebar. tasks = open tasks for the dropdown
export default function TimerCard({ tasks, todayMinutes }) {
  const timer = useStudyTimer();
  const [taskId, setTaskId] = useState("");
  const [focus, setFocus] = useState("0");
  const [error, setError] = useState("");

  async function handleStart() {
    setError("");
    const res = await timer.start({ taskId, focus: Number(focus) });
    if (!res.ok) setError(res.message);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Study timer</h2>
        {todayMinutes > 0 && <span className="text-xs text-inksoft">Today: {fmtMinutes(todayMinutes)}</span>}
      </div>

      {!timer.ready ? (
        <p className="text-sm text-inksoft">Loading...</p>
      ) : timer.active ? (
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 p-3">
          <p className="truncate text-sm font-medium">{timer.active.title}</p>
          <p className="mt-1 font-mono text-2xl tabular-nums">{timer.display}</p>
          <p className="text-xs text-inksoft">
            {timer.timeUp ? "Focus time is up!" : timer.remainingSec !== null ? "left" : "elapsed"}
          </p>
          <button
            type="button"
            onClick={timer.stop}
            disabled={timer.busy}
            className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {timer.timeUp ? "Stop & save" : "Stop"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            aria-label="Task to study"
            className={inputClass}
          >
            <option value="">No task (general study)</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            aria-label="Timer type"
            className={inputClass}
          >
            {FOCUS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Alert>{error}</Alert>
          <button
            type="button"
            onClick={handleStart}
            disabled={timer.busy}
            className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {timer.busy ? "Starting..." : "Start timer"}
          </button>
        </div>
      )}
    </div>
  );
}