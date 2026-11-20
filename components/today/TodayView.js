"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DetailPanel from "@/components/dashboard/DetailPanel";
import GoogleBadge from "@/components/common/GoogleBadge";
import Alert from "@/components/common/Alert";
import { callApi } from "@/lib/callApi";
import { eventStyle, priorityLabels, priorityStyles } from "@/lib/ui";
import { formatMinutes } from "@/lib/format";

const OVERDUE_PREVIEW = 8; // long backlogs get a "Show all" button

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Times are shown in the user's saved timezone (data.tz), the same one the server used to pick the days.
const clock = (iso, tz) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
const dayAndClock = (iso, tz) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
const dayOnly = (iso, tz) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });

const rose = "text-rose-700 dark:text-rose-300";
const card =
  "overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900";
const list = "divide-y divide-neutral-200 dark:divide-neutral-800";

const countdown = (n) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`);
const urgency = (n) =>
  n <= 2 ? rose : n <= 7 ? "text-amber-700 dark:text-amber-300" : "text-ink";

function ExamTag() {
  return (
    <span className="rounded-full bg-violet-50 dark:bg-violet-950 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
      Exam
    </span>
  );
}

function Section({ id, title, aside, titleClass = "", children }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={id} className={`font-semibold ${titleClass}`}>
          {title}
        </h2>
        {aside ? <span className="text-xs text-inksoft">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

// One task or event. mode: "overdue" | "today" | "upcoming"
function Row({ item, mode, tz, done, onToggle, onOpen }) {
  const isTask = item.kind === "task";
  const style = isTask ? priorityStyles[item.priority] : null;

  const bits = [];
  if (mode === "overdue") {
    bits.push(
      <span key="late" className={rose}>
        Due {dayAndClock(item.at, tz)}, {plural(item.daysLate, "day")} late
      </span>
    );
  }
  if (isTask && mode === "today" && item.pastDue && !done) {
    bits.push(
      <span key="past" className={rose}>
        Past due
      </span>
    );
  }
  if (!isTask && !item.allDay) bits.push(<span key="end">until {clock(item.endAt, tz)}</span>);
  if (item.subject) bits.push(<span key="subject">{item.subject}</span>);

  return (
    <li className={`flex items-start gap-3 px-4 py-3 ${done || item.over ? "opacity-60" : ""}`}>
      {mode !== "overdue" && (
        <span className="w-[4.5rem] shrink-0 pt-0.5 text-xs tabular-nums text-inksoft">
          {item.allDay ? "All day" : clock(item.at, tz)}
        </span>
      )}

      {isTask ? (
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(item)}
          aria-label={`${done ? "Reopen" : "Mark done"}: ${item.title}`}
          className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 dark:border-neutral-600 accent-blue-600"
        />
      ) : (
        <span aria-hidden="true" className={`mt-0.5 h-5 shrink-0 border-l-4 ${eventStyle.accent}`} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => onOpen(item)}
            className={`text-left font-medium hover:underline ${done ? "line-through text-inksoft" : ""}`}
          >
            {item.title}
          </button>
          {item.isExam && <ExamTag />}
          {style && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${style.bg} ${style.text} ${style.border}`}
            >
              {priorityLabels[item.priority]}
            </span>
          )}
          {item.linked ? <GoogleBadge /> : null}
        </div>
        {bits.length > 0 && (
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-inksoft">{bits}</p>
        )}
      </div>
    </li>
  );
}

function ExamCard({ exam, tz, onOpen }) {
  const when = exam.allDay ? dayOnly(exam.at, tz) : dayAndClock(exam.at, tz);

  let study;
  if (exam.studiedMin === null) {
    study = <span className="text-inksoft">Add a subject to track study time for this exam.</span>;
  } else if (exam.studiedMin === 0) {
    study = (
      <span className={exam.daysAway <= 7 ? "text-amber-700 dark:text-amber-300" : "text-inksoft"}>
        No {exam.subject} study logged in the last 7 days.
      </span>
    );
  } else {
    study = (
      <span className="text-inksoft">
        {formatMinutes(exam.studiedMin)} of {exam.subject} studied in the last 7 days.
      </span>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(exam)}
        className={`${card} block h-full w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/60`}
      >
        <p className={`text-lg font-semibold ${urgency(exam.daysAway)}`}>{countdown(exam.daysAway)}</p>
        <p className="mt-1 font-medium">{exam.title}</p>
        <p className="mt-0.5 text-xs text-inksoft">
          {exam.kind === "task" ? "Due " : ""}
          {when}
        </p>
        <p className="mt-3 text-xs">{study}</p>
      </button>
    </li>
  );
}

export default function TodayView({ data }) {
  const router = useRouter();
  const { tz } = data;

  const [overrides, setOverrides] = useState({}); // taskId -> done, shown until the refresh lands
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  // fresh data from the server replaces the optimistic state
  useEffect(() => {
    setOverrides({});
  }, [data]);

  const isDone = (item) => overrides[item.refId] ?? item.done;
  const open = (item) => setSelected({ kind: item.kind, id: item.refId });

  async function toggle(item) {
    const nextDone = !isDone(item);
    setError("");
    setOverrides((o) => ({ ...o, [item.refId]: nextDone }));

    const { ok, data: res } = await callApi(`/api/tasks/${item.refId}`, "PATCH", {
      status: nextDone ? "DONE" : "TODO",
    });
    if (!ok) {
      setOverrides((o) => {
        const rest = { ...o };
        delete rest[item.refId];
        return rest;
      });
      setError(res?.message || "Could not update the task. Try again.");
      return;
    }
    router.refresh();
  }

  const rowProps = { tz, onToggle: toggle, onOpen: open };

  const overdueOpen = data.overdue.filter((i) => !isDone(i)).length;
  const overdueShown = showAllOverdue ? data.overdue : data.overdue.slice(0, OVERDUE_PREVIEW);

  const todayTasks = data.today.filter((i) => i.kind === "task");
  const todayDone = todayTasks.filter(isDone).length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 md:px-6 md:py-4">
        <div>
          <h1 className="text-xl font-semibold">Today</h1>
          <p className="text-sm text-inksoft">{data.dateLabel}</p>
        </div>
        <Link
          href="/"
          className="flex h-8 items-center rounded-md border border-neutral-300 dark:border-neutral-700 px-3 text-sm text-ink hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Calendar
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-4 md:p-6">
        {data.warnings.length > 0 && (
          <div
            role="status"
            className="rounded-md bg-amber-50 dark:bg-amber-950/70 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <p className="font-medium">Heavy workload ahead</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <Alert>{error}</Alert>

        {data.overdue.length > 0 && (
          <Section id="overdue" title="Overdue" titleClass={rose} aside={`${overdueOpen} open`}>
            <div className="overflow-hidden rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30">
              <ul className="divide-y divide-rose-100 dark:divide-rose-900/60">
                {overdueShown.map((item) => (
                  <Row key={item.id} item={item} mode="overdue" done={isDone(item)} {...rowProps} />
                ))}
              </ul>
              {data.overdue.length > OVERDUE_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAllOverdue(!showAllOverdue)}
                  className="block w-full border-t border-rose-100 dark:border-rose-900/60 px-4 py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showAllOverdue ? "Show fewer" : `Show all ${data.overdue.length}`}
                </button>
              )}
            </div>
          </Section>
        )}

        <Section
          id="today"
          title="Today"
          aside={todayTasks.length > 0 ? `${todayDone} of ${plural(todayTasks.length, "task")} done` : ""}
        >
          <div className={card}>
            {data.finishedEvents.length > 0 && (
              <div className="border-b border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowFinished(!showFinished)}
                  aria-expanded={showFinished}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-inksoft hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                >
                  <span>{plural(data.finishedEvents.length, "finished event")}</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {showFinished ? "Hide" : "Show"}
                  </span>
                </button>
                {showFinished && (
                  <ul className={`${list} border-t border-neutral-200 dark:border-neutral-800`}>
                    {data.finishedEvents.map((item) => (
                      <Row key={item.id} item={item} mode="today" done={false} {...rowProps} />
                    ))}
                  </ul>
                )}
              </div>
            )}
            {data.today.length === 0 ? (
              <p className="px-4 py-5 text-sm text-inksoft">
                {data.finishedEvents.length > 0
                  ? "Nothing else due or scheduled today."
                  : "Nothing due or scheduled today."}
              </p>
            ) : (
              <ul className={list}>
                {data.today.map((item) => (
                  <Row key={item.id} item={item} mode="today" done={isDone(item)} {...rowProps} />
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 text-sm">
              <span>
                <span className="text-inksoft">Study time today: </span>
                <span className="font-medium">
                  {data.studyMinutes > 0
                    ? `${formatMinutes(data.studyMinutes)} in ${plural(data.studyCount, "session")}`
                    : "none logged yet"}
                </span>
              </span>
              <Link href="/study/new" className="text-blue-600 dark:text-blue-400 hover:underline">
                + Log study time
              </Link>
            </div>
          </div>
        </Section>

        <Section id="exams" title="Exam countdown">
          {data.exams.length === 0 ? (
            <p className="text-sm text-inksoft">
              No exams coming up. Tick &ldquo;This is an exam&rdquo; when you add or edit a task or
              event and it will show up here.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} tz={tz} onOpen={open} />
              ))}
            </ul>
          )}
        </Section>

        <Section id="upcoming" title="Coming up" aside="Next 7 days">
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-inksoft">Nothing scheduled for the next 7 days.</p>
          ) : (
            <div className="space-y-5">
              {data.upcoming.map((day) => (
                <div key={day.key}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-medium">
                      {day.label} <span className="font-normal text-inksoft">{day.date}</span>
                    </h3>
                    {day.heavy && (
                      <span className="rounded-full bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        {plural(day.openCount, "deadline")}
                      </span>
                    )}
                  </div>
                  <div className={card}>
                    <ul className={list}>
                      {day.items.map((item) => (
                        <Row
                          key={item.id}
                          item={item}
                          mode="upcoming"
                          done={isDone(item)}
                          {...rowProps}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </main>

      {selected && (
        <DetailPanel
          key={`${selected.kind}-${selected.id}`}
          target={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}