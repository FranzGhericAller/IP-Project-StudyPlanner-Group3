import { prisma } from "@/lib/db";
import { getCalendarClient } from "@/lib/googleCalendar";

const CALENDAR_ID = "primary";

function body(ev) {
  return {
    summary: ev.title,
    description: ev.description ?? "",
    start: { dateTime: ev.startAt.toISOString() },
    end: { dateTime: ev.endAt.toISOString() },
  };
}

// new event made in the app -> also create it in Google Calendar.
// it stays source LOCAL (so it keeps the "My Event" color) but gets a googleEventId.
export async function pushEventCreate(userId, eventId) {
  try {
    const calendar = await getCalendarClient(userId);
    if (!calendar) return;

    const ev = await prisma.event.findFirst({ where: { id: eventId, userId, googleEventId: null } });
    if (!ev) return;

    const { data } = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: body(ev),
    });

    await prisma.event.update({
      where: { id: ev.id },
      data: { googleCalendarId: CALENDAR_ID, googleEventId: data.id, etag: data.etag ?? null },
    });
  } catch (err) {
    console.error("Push event create failed:", err);
  }
}

// edited in the app (works for both app-made and synced events)
export async function pushEventUpdate(userId, eventId) {
  try {
    const calendar = await getCalendarClient(userId);
    if (!calendar) return;

    const ev = await prisma.event.findFirst({
      where: { id: eventId, userId, googleEventId: { not: null } },
    });
    if (!ev || ev.allDay) return; // all-day events are left alone for now

    const { data } = await calendar.events.patch({
      calendarId: ev.googleCalendarId || CALENDAR_ID,
      eventId: ev.googleEventId,
      requestBody: body(ev),
    });
    await prisma.event.update({ where: { id: ev.id }, data: { etag: data.etag ?? null } });
  } catch (err) {
    console.error("Push event update failed:", err);
  }
}

// call BEFORE removing the local row
export async function pushEventDelete(userId, eventId) {
  try {
    const calendar = await getCalendarClient(userId);
    if (!calendar) return;

    const ev = await prisma.event.findFirst({
      where: { id: eventId, userId, googleEventId: { not: null } },
    });
    if (!ev) return;

    await calendar.events.delete({
      calendarId: ev.googleCalendarId || CALENDAR_ID,
      eventId: ev.googleEventId,
    });
  } catch (err) {
    // 404/410 = already gone in Google, which is fine
    if (err?.code !== 404 && err?.code !== 410) console.error("Push event delete failed:", err);
  }
}