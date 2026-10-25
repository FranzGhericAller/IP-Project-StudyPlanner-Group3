// Date helpers for the calendar. No libraries needed.
// Everything here uses the browser's local timezone (the Calendar component only runs in the browser).

// Hours shown in the weekly grid: 6 AM to 10 PM.
export const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export function clampHour(h) {
  return Math.min(Math.max(h, HOURS[0]), HOURS[HOURS.length - 1]);
}

export function hourLabel(h) {
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12} ${suffix}`;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Monday of the week that contains `date`, at midnight.
export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
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

// A string key like "2026-9-25" used to group items by calendar day.
export function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// The 7 days (Mon-Sun) of the week containing `date`.
export function weekDaysFrom(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Array of weeks, each an array of 7 Dates, covering the month of `date`.
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

// Map of dayKey -> items for that day, sorted by time.
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