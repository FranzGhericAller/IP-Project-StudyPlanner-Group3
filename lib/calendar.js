// Date helpers for the calendar (no library needed).
// Uses the browser's timezone since the Calendar only renders in the browser.

// rows shown in the weekly view: 6 AM to 10 PM
export const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

// keeps very early/late items inside the first or last row
export function clampHour(h) {
  return Math.min(Math.max(h, HOURS[0]), HOURS[HOURS.length - 1]);
}

// 13 -> "1 PM"
export function hourLabel(h) {
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12} ${suffix}`;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Monday of the week, at midnight
export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // Mon = 0 ... Sun = 6
  d.setDate(d.getDate() - offset);
  return d;
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// key like "2026-9-25", used to group items by day
export function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// the 7 days (Mon to Sun) of the week
export function weekDaysFrom(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// all the weeks shown for a month, each week = array of 7 dates
export function monthWeeks(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(last), 6);

  const weeks = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i)));
  }
  return weeks;
}

// dayKey -> list of items that day, sorted by time
export function groupByDay(items) {
  const map = new Map();
  for (const item of items) {
    const key = dayKey(item.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  for (const list of map.values()) list.sort((a, b) => a.date - b.date);
  return map;
}
