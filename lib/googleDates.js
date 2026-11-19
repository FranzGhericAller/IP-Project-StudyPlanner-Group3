// Google Tasks only stores a date (no time), so we convert using the user's timezone.

// "2026-11-20" for a Date, as seen in the given timezone
export function dateKey(date, tz = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
}

// the value Google Tasks expects for `due`
export function toGoogleDue(date, tz = "Asia/Manila") {
  return `${dateKey(date, tz)}T00:00:00.000Z`;
}