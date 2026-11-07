"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@/components/common/Alert";
import { callApi } from "@/lib/callApi";
import { inputClass, priorityLabels, priorityStyles } from "@/lib/ui";

// "Task Manager" box in the sidebar (open tasks only).
// After each change we call router.refresh() so the page reloads the data from the db.
export default function TaskList({ tasks }) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null); // task that's currently saving
  const [error, setError] = useState("");

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

  // done tasks disappear from this list
  async function completeTask(task) {
    setBusyId(task.id);
    setError("");
    const { ok, data } = await callApi(`/api/tasks/${task.id}`, "PATCH", { status: "DONE" });
    setBusyId(null);

    if (!ok) {
      setError(data.message || "Could not update the task.");
      return;
    }
    router.refresh();
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.name}"?`)) return;

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

      {tasks.length === 0 ? (
        <p className="text-sm text-inksoft">No tasks yet. Add your first one above.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const busy = busyId === task.id;
            return (
              <li
                key={task.id}
                className={`flex items-center gap-2 text-sm ${busy ? "opacity-50" : ""}`}
              >
                {/* circle = priority color, click to mark done */}
                <button
                  type="button"
                  onClick={() => completeTask(task)}
                  disabled={busy}
                  aria-label="Mark as done"
                  title={`${priorityLabels[task.priority]} priority. Click to mark as done.`}
                  className={`h-4 w-4 shrink-0 rounded-full border-2 ${priorityStyles[task.priority].border}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{task.name}</span>
                  {task.subject && (
                    <span className="block truncate text-xs text-inksoft">{task.subject}</span>
                  )}
                </span>
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
                  onClick={() => deleteTask(task)}
                  disabled={busy}
                  aria-label={`Delete ${task.name}`}
                  title="Delete"
                  className="text-inksoft hover:text-rose-600"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/tasks/new"
        className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
      >
        + Add Task
      </Link>
    </div>
  );
}
