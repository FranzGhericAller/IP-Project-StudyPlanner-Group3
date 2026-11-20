// Today view maths. Same rule as progress.js: a "day" is a "YYYY-MM-DD" key in the user's timezone.
// Nothing in here touches the database, so it is easy to test.

import { addDaysKey, makeKeyFn } from "@/lib/progress";

// What counts as a heavy workload. Change these numbers to tune the warning.
export const WORKLOAD = {
  heavyDay: 4, // open deadlines on a single day
  heavyWeek: 10, // open deadlines over the next 7 days
};

// a finished event stays in the Today list this long, then folds into "N finished events"
export const FINISHED_GRACE_MIN = 60;

export const WINDOW_DAYS = 7; // "Coming up" looks this many days past today
export const EXAM_LOOKAHEAD_DAYS = 60; // exams further away than this are not listed
const MAX_EXAMS = 6;

const DAY = 24 * 60 * 60 * 1000;
const FALLBACK_TZ = "Asia/Manila"; // same fallback as progress.js

export function resolveTz(tz) {
  if (!tz) return FALLBACK_TZ;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    return FALLBACK_TZ; // bad timezone saved
  }
}

// How far to read from the db. Padded by 2 days on each side so every timezone is covered,
// then buildToday() sorts things into the right day.
export function queryWindow(now = new Date()) {
  const t = now.getTime();
  return {
    from: new Date(t - 2 * DAY),
    to: new Date(t + (WINDOW_DAYS + 2) * DAY),
    examTo: new Date(t + EXAM_LOOKAHEAD_DAYS * DAY),
    studySince: new Date(t - 9 * DAY),
  };
}

const pseudo = (key) => new Date(`${key}T00:00:00Z`);
const daysBetween = (fromKey, toKey) => Math.round((pseudo(toKey) - pseudo(fromKey)) / DAY);
const fmtKey = (key, opts) =>
  pseudo(key).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
const deadlines = (n) => `${n} ${n === 1 ? "deadline" : "deadlines"}`;

// all-day events first, then by start time
const byTime = (a, b) =>
  Number(Boolean(b.allDay)) - Number(Boolean(a.allDay)) || a.at.localeCompare(b.at);

// tasks = open tasks due before the window ends + done tasks due inside it (so a checked-off
//         task stays on the page and can be un-checked)
// events = events starting inside the window
// examTasks / examEvents = upcoming exams (separate query, they can be further out)
// sessions = [{ startedAt, durationMin, subjectId, task: { subjectId } }]
export function buildToday({
  tasks,
  events,
  examTasks,
  examEvents,
  sessions,
  tz: rawTz,
  now = new Date(),
}) {
  const tz = resolveTz(rawTz);
  const keyOf = makeKeyFn(tz);
  const todayKey = keyOf(now);
  const lastKey = addDaysKey(todayKey, WINDOW_DAYS);
  const nowMs = now.getTime();

  const taskItem = (t) => {
    const done = t.status === "DONE";
    return {
      id: `task-${t.id}`,
      refId: t.id,
      kind: "task",
      title: t.title,
      subject: t.subject?.name ?? "",
      subjectId: t.subjectId ?? null,
      at: t.dueAt.toISOString(),
      dayKey: keyOf(t.dueAt),
      priority: t.priority,
      done,
      pastDue: !done && t.dueAt.getTime() < nowMs,
      isExam: Boolean(t.isExam),
      linked: Boolean(t.googleTaskId),
    };
  };

  const eventItem = (e) => ({
    id: `event-${e.id}`,
    refId: e.id,
    kind: "event",
    title: e.title,
    subject: e.subject?.name ?? "",
    subjectId: e.subjectId ?? null,
    at: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    dayKey: keyOf(e.startAt),
    allDay: Boolean(e.allDay),
    over: !e.allDay && e.endAt.getTime() < nowMs,
    isExam: Boolean(e.isExam),
    linked: Boolean(e.googleEventId),
  });

  // ---- sort everything into overdue / today / the next 7 days ----
  const overdue = [];
  const today = [];
  const days = new Map(); // dayKey -> items

  const place = (it) => {
    if (it.dayKey === todayKey) {
      today.push(it);
    } else if (it.dayKey > todayKey && it.dayKey <= lastKey) {
      if (!days.has(it.dayKey)) days.set(it.dayKey, []);
      days.get(it.dayKey).push(it);
    }
  };

  for (const t of tasks) {
    const it = taskItem(t);
    if (it.dayKey < todayKey) {
      // overdue means a day before today. a task due earlier today stays under Today, flagged "Past due"
      if (!it.done) overdue.push({ ...it, daysLate: daysBetween(it.dayKey, todayKey) });
    } else {
      place(it);
    }
  }
  for (const e of events) place(eventItem(e));

  overdue.sort((a, b) => a.at.localeCompare(b.at)); // oldest first
  today.sort(byTime);

  const graceMs = FINISHED_GRACE_MIN * 60 * 1000;
  const isCollapsed = (it) =>
    it.kind === "event" && !it.allDay && new Date(it.endAt).getTime() + graceMs < nowMs;
  const finishedEvents = today.filter(isCollapsed);
  const visibleToday = today.filter((it) => !isCollapsed(it));

  // ---- study time: today's total, and minutes per subject over the last 7 days ----
  const sinceKey = addDaysKey(todayKey, -6);
  const studiedBySubject = new Map();
  let studyMinutes = 0;
  let studyCount = 0;
  for (const s of sessions) {
    if (!(s.durationMin > 0)) continue;
    const k = keyOf(s.startedAt);
    if (k === todayKey) {
      studyMinutes += s.durationMin;
      studyCount++;
    }
    if (k < sinceKey || k > todayKey) continue;
    const sid = s.subjectId ?? s.task?.subjectId ?? null; // fall back to the task's subject
    if (sid) studiedBySubject.set(sid, (studiedBySubject.get(sid) || 0) + s.durationMin);
  }

  // ---- exam countdown ----
  const exams = [...examTasks.map(taskItem), ...examEvents.map(eventItem)]
    .filter((it) => it.dayKey >= todayKey)
    .map((it) => ({
      ...it,
      daysAway: daysBetween(todayKey, it.dayKey),
      // null = no subject, so there is nothing to measure
      studiedMin: it.subjectId ? studiedBySubject.get(it.subjectId) || 0 : null,
    }))
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, MAX_EXAMS);

  // ---- workload: count open deadlines per day ----
  const openTasks = (list) => list.filter((x) => x.kind === "task" && !x.done).length;

  let weekCount = 0;
  const heavyDays = [];
  for (let i = 0; i <= WINDOW_DAYS; i++) {
    const key = addDaysKey(todayKey, i);
    const n = openTasks(i === 0 ? today : days.get(key) || []);
    if (i < 7) weekCount += n;
    if (n >= WORKLOAD.heavyDay) {
      const when =
        i === 0
          ? "today"
          : i === 1
          ? "tomorrow"
          : i === 7
          ? `next ${fmtKey(key, { weekday: "long" })}`
          : `on ${fmtKey(key, { weekday: "long" })}`;
      heavyDays.push(`${deadlines(n)} ${when}`);
    }
  }
  const warnings = [];
  if (weekCount >= WORKLOAD.heavyWeek) warnings.push(`${deadlines(weekCount)} in the next 7 days`);
  warnings.push(...heavyDays);

  // ---- coming up ----
  const upcoming = [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const openCount = openTasks(items);
      return {
        key,
        label: daysBetween(todayKey, key) === 1 ? "Tomorrow" : fmtKey(key, { weekday: "long" }),
        date: fmtKey(key, { month: "short", day: "numeric" }),
        openCount,
        heavy: openCount >= WORKLOAD.heavyDay,
        items: items.sort(byTime),
      };
    });

  return {
    tz,
    todayKey,
    dateLabel: fmtKey(todayKey, { weekday: "long", month: "long", day: "numeric" }),
    overdue,
    today: visibleToday,
    finishedEvents,
    studyMinutes,
    studyCount,
    exams,
    upcoming,
    warnings,
  };
}