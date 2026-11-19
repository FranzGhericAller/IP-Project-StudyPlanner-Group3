"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@/components/common/Alert";
import ResourceBadge, { resourceHref } from "@/components/common/ResourceBadge";
import { callApi } from "@/lib/callApi";
import { inputClass } from "@/lib/ui";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "DRIVE", label: "Google Drive" },
  { key: "LOCAL", label: "Files" },
];

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ResourceLibrary({ resources: initial }) {
  const [resources, setResources] = useState(initial);
  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      ALL: resources.length,
      DRIVE: resources.filter((r) => r.provider === "DRIVE").length,
      LOCAL: resources.filter((r) => r.provider === "LOCAL").length,
    }),
    [resources]
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = resources.filter(
      (r) =>
        (tab === "ALL" || r.provider === tab) &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.attachedTo?.title.toLowerCase().includes(q))
    );

    const map = new Map();
    for (const r of shown) {
      const key = r.subject || "No subject";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return [...map.entries()].sort(([a], [b]) =>
      a === "No subject" ? 1 : b === "No subject" ? -1 : a.localeCompare(b)
    );
  }, [resources, tab, query]);

  async function remove(r) {
    if (!window.confirm(`Remove "${r.title}"?`)) return;
    setError("");
    const { ok, data } = await callApi(`/api/resources/${r.id}`, "DELETE");
    if (!ok) {
      setError(data.message || "Could not remove it.");
      return;
    }
    setResources((list) => list.filter((x) => x.id !== r.id));
  }

  if (resources.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-[15px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
          <h2 className="font-semibold">No resources yet</h2>
          <p className="mt-2 text-sm text-inksoft">
            Open a task or event on the dashboard, then use <b>+ Google Drive link</b> or{" "}
            <b>+ Upload file</b>. Everything you attach shows up here, grouped by subject.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-blue-700 dark:bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-800 dark:hover:bg-blue-700"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-full border px-3 py-1 text-sm ${
              tab === t.key
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-inksoft hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources..."
          aria-label="Search resources"
          className={`${inputClass} ml-auto max-w-xs`}
        />
      </div>

      <Alert>{error}</Alert>

      {groups.length === 0 && (
        <p className="text-sm text-inksoft">No resources match your filter.</p>
      )}

      {groups.map(([subject, items]) => (
        <section
          key={subject}
          className="rounded-[15px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5"
        >
          <h2 className="mb-3 flex items-center justify-between font-semibold">
            {subject}
            <span className="text-xs font-normal text-inksoft">{items.length}</span>
          </h2>
          <ul className="space-y-2">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-md bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
              >
                <ResourceBadge provider={r.provider} />
                <div className="min-w-0 flex-1">
                  <a
                    href={resourceHref(r)}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {r.title}
                  </a>
                  <p className="truncate text-xs text-inksoft">
                    {r.attachedTo
                      ? `${r.attachedTo.kind === "task" ? "Task" : "Event"}: ${r.attachedTo.title}`
                      : "Not attached"}
                    {r.sizeBytes ? ` · ${formatSize(r.sizeBytes)}` : ""}
                  </p>
                </div>
                <span suppressHydrationWarning className="shrink-0 text-xs text-inksoft">
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  aria-label={`Remove ${r.title}`}
                  title="Remove"
                  className="shrink-0 text-inksoft hover:text-rose-600 dark:hover:text-rose-400"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}