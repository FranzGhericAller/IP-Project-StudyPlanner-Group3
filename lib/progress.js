// Study progress maths. Days are "YYYY-MM-DD" keys in the user's timezone.

const pseudo = (key) => new Date(`${key}T00:00:00Z`);

export function addDaysKey(key, n) {
  const d = pseudo(key);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// a function that turns a Date into that user's "YYYY-MM-DD"
export function makeKeyFn(tz) {
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz });
  } catch {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }); // bad timezone saved
  }
  return (date) => fmt.format(date);
}

const shortDate = (key) =>
  pseudo(key).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const weekdayShort = (key) =>
  pseudo(key).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

// sessions = [{ startedAt: Date, durationMin: number }]
// returns this week's total, the streaks and a per-day map
export function summarize({ sessions, tz, now = new Date(), goalMin }) {
  const keyOf = makeKeyFn(tz);
  const todayKey = keyOf(now);

  // weeks start on Monday, like the calendar
  const dow = (pseudo(todayKey).getUTCDay() + 6) % 7;
  const weekStartKey = addDaysKey(todayKey, -dow);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysKey(weekStartKey, i));

  const byDay = new Map();
  for (const s of sessions) {
    if (!(s.durationMin > 0)) continue;
    const k = keyOf(s.startedAt);
    byDay.set(k, (byDay.get(k) || 0) + s.durationMin);
  }

  const weekMinutes = weekDays.reduce((sum, k) => sum + (byDay.get(k) || 0), 0);
  const studiedToday = (byDay.get(todayKey) || 0) > 0;

  // current streak: counts back from today, or from yesterday if you haven't studied yet today
  let cursor = studiedToday ? todayKey : addDaysKey(todayKey, -1);
  let currentStreak = 0;
  while ((byDay.get(cursor) || 0) > 0) {
    currentStreak++;
    cursor = addDaysKey(cursor, -1);
  }

  // best streak: longest run of consecutive days
  let bestStreak = 0;
  let run = 0;
  let prev = null;
  for (const k of [...byDay.keys()].sort()) {
    run = prev && addDaysKey(prev, 1) === k ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = k;
  }

  const percent = goalMin > 0 ? Math.round((weekMinutes / goalMin) * 100) : 0;

  return {
    keyOf,
    todayKey,
    weekStartKey,
    weekDays,
    byDay,
    weekMinutes,
    goalMin,
    percent,
    currentStreak,
    bestStreak,
    studiedToday,
  };
}

// everything the Progress page needs, as plain data the browser can receive.
// sessions = [{ startedAt, durationMin, subjectId }], subjectNames = { id: name },
// doneTasks = [{ subjectId, completedAt }]
export function buildProgress({ sessions, subjectNames, doneTasks, tz, now = new Date(), goalMin }) {
  const base = summarize({ sessions, tz, now, goalMin });
  const { keyOf, todayKey, weekDays, byDay } = base;

  const monthKey = todayKey.slice(0, 7); // "2026-11"
  const inWeek = new Set(weekDays);

  const rows = new Map(); // subject name -> totals
  const row = (name) => {
    if (!rows.has(name)) {
      rows.set(name, {
        name,
        minutes: { week: 0, month: 0, all: 0 },
        tasks: { week: 0, month: 0, all: 0 },
      });
    }
    return rows.get(name);
  };
  const nameOf = (id) => (id && subjectNames[id]) || "No subject";

  let totalMinutes = 0;
  for (const s of sessions) {
    if (!(s.durationMin > 0)) continue;
    const k = keyOf(s.startedAt);
    const r = row(nameOf(s.subjectId));
    r.minutes.all += s.durationMin;
    if (k.startsWith(monthKey)) r.minutes.month += s.durationMin;
    if (inWeek.has(k)) r.minutes.week += s.durationMin;
    totalMinutes += s.durationMin;
  }

  for (const t of doneTasks) {
    const k = t.completedAt ? keyOf(t.completedAt) : null;
    const r = row(nameOf(t.subjectId));
    r.tasks.all++;
    if (k && k.startsWith(monthKey)) r.tasks.month++;
    if (k && inWeek.has(k)) r.tasks.week++;
  }

  return {
    goalMin,
    weekMinutes: base.weekMinutes,
    currentStreak: base.currentStreak,
    bestStreak: base.bestStreak,
    studiedToday: base.studiedToday,
    totalMinutes,
    weekLabel: `${shortDate(weekDays[0])} to ${shortDate(weekDays[6])}`,
    days: weekDays.map((k) => ({
      key: k,
      label: weekdayShort(k),
      day: Number(k.slice(8)),
      minutes: byDay.get(k) || 0,
      isToday: k === todayKey,
      isFuture: k > todayKey,
    })),
    subjects: [...rows.values()],
  };
}