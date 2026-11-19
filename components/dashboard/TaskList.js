"use client";

import { useEffect, useRef, useState } from "react";
import GoogleBadge from "@/components/common/GoogleBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@/components/common/Alert";
import { callApi } from "@/lib/callApi";
import { inputClass, priorityLabels, priorityStyles } from "@/lib/ui";


// "Nov 20" + whether it's already past (before today)
function dueInfo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: d.getTime() < new Date().setHours(0, 0, 0, 0),
  };
}

// one task row. done = shown inside the Completed section
function Row({ task, done, busy, onToggle, onDelete, onOpen }) {
  const due = dueInfo(task.dueAt);
  return (
    <li className={`flex items-center gap-2 text-sm ${busy ? "opacity-50" : ""}`}>
      {/* circle = priority color. click to mark done (or reopen in Completed) */}
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        title={
          done
            ? "Completed. Click to reopen."
            : `${priorityLabels[task.priority]} priority. Click to mark as done.`
        }
        className={`h-4 w-4 shrink-0 rounded-full border-2 ${priorityStyles[task.priority].border} ${
          done ? "bg-neutral-300" : ""
        }`}
      />
      {/* click the name to open the details panel */}
      <button
        type="button"
        onClick={() => onOpen?.(task)}
        title="Open details"
        className="min-w-0 flex-1 text-left hover:text-blue-700"
      >
        <span className={`flex items-center gap-1.5 ${done ? "text-inksoft line-through" : ""}`}>
          <span className="truncate">{task.name}</span>
          {task.linked && <GoogleBadge />}
        </span>
        {(task.subject || (due && !done)) && (
          <span className="flex gap-1 text-xs text-inksoft">
            {task.subject && <span className="truncate">{task.subject}</span>}
            {due && !done && (
              <span suppressHydrationWarning className={due.overdue ? "text-rose-600" : ""}>
                {task.subject ? "· " : ""}Due {due.text}
              </span>
            )}
          </span>
        )}
      </button>
      <Link
        href={`/tasks/${task.id}/edit`}
        aria-label={`Edit ${task.name}`}
        title="Edit"
        className="text-inksoft hover:text-blue-600"
      >
        ✎
      </Link>
      <button
        type="button"
        onClick={() => onDelete(task)}
        disabled={busy}
        aria-label={`Delete ${task.name}`}
        title="Delete"
        className="text-inksoft hover:text-rose-600"
      >
        ✕
      </button>
    </li>
  );
}

// "Task Manager" box in the sidebar: open tasks + a collapsible Completed section.
// After each change we call router.refresh() so the page reloads the data from the db.
export default function TaskList({ tasks, completedTasks = [], onOpen }) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null); // task that's currently saving
  const [error, setError] = useState("");
  const [undo, setUndo] = useState(null); // { id, name } of the task just completed
  const undoTimer = useRef(null);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  // quick add: type a title + Enter
  async function addTask(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setAdding(true);
    setError("");
    const { ok, data } = await callApi("/api/tasks", "POST", { title, priority: "MED" });
    setAdding(false);

    if (!ok) {
      setError(data.errors?.title || data.message || "Could not add the task.");
      return;
    }
    setNewTitle("");
    router.refresh();
  }

  function showUndo(task) {
    clearTimeout(undoTimer.current);
    setUndo({ id: task.id, name: task.name });
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  }

  // set a task to DONE or back to TODO
  async function setStatus(task, status) {
    setBusyId(task.id);
    setError("");
    const { ok, data } = await callApi(`/api/tasks/${task.id}`, "PATCH", { status });
    setBusyId(null);

    if (!ok) {
      setError(data.message || "Could not update the task.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function completeTask(task) {
    if (await setStatus(task, "DONE")) showUndo(task);
  }

  async function reopenTask(task) {
    await setStatus(task, "TODO");
  }

  async function undoComplete() {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    const { id, name } = undo;
    setUndo(null);
    await setStatus({ id, name }, "TODO");
  }

  async function deleteTask(task) {
    const linked = task.linked ? " It will also be deleted from Google Tasks." : "";
    if (!window.confirm(`Delete "${task.name}"?${linked}`)) return;

    setBusyId(task.id);
    setError("");
    const { ok, data } = await callApi(`/api/tasks/${task.id}`, "DELETE");
    setBusyId(null);

    if (!ok) {
      setError(data.message || "Could not delete the task.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <h2 className="font-semibold mb-3">Task Manager</h2>

      <form onSubmit={addTask}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={adding}
          maxLength={191}
          placeholder="+ Add new task... (press Enter)"
          aria-label="Quick add task"
          className={`${inputClass} mb-3 disabled:opacity-60`}
        />
      </form>

      <Alert>{error}</Alert>

      {undo && (
        <div
          role="status"
          className="mb-3 flex items-center justify-between gap-2 rounded-md bg-neutral-900 px-3 py-2 text-xs text-white"
        >
          <span className="min-w-0 truncate">Completed &quot;{undo.name}&quot;</span>
          <button
            type="button"
            onClick={undoComplete}
            className="shrink-0 font-semibold text-blue-300 hover:text-blue-200"
          >
            Undo
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-inksoft">No open tasks. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <Row
              key={task.id}
              task={task}
              done={false}
              busy={busyId === task.id}
              onToggle={completeTask}
              onDelete={deleteTask}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}

      <Link
        href="/tasks/new"
        className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
      >
        + Add Task
      </Link>

      {completedTasks.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-inksoft hover:text-ink">
            Completed ({completedTasks.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {completedTasks.map((task) => (
              <Row
                key={task.id}
                task={task}
                done
                busy={busyId === task.id}
                onToggle={reopenTask}
                onDelete={deleteTask}
                onOpen={onOpen}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}