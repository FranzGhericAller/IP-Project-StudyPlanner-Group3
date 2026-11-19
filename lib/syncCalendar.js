import { prisma } from "@/lib/db";
import { getCalendarClient } from "@/lib/googleCalendar";

const CALENDAR_ID = "primary";
const DAY = 86400000;
const BATCH = 5; // rows saved at the same time

export async function syncUserCalendar(userId) {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return { connected: false };

  const stateKey = { userId_calendarId: { userId, calendarId: CALENDAR_ID } };
  const state = await prisma.syncState.findUnique({ where: stateKey });

  let result;
  try {
    try {
      result = await pull(calendar, userId, state?.syncToken ?? null);
    } catch (err) {
      // 410 = Google says our saved token is too old -> start over with a full sync
      if (err?.code === 410 && state?.syncToken) {
        result = await pull(calendar, userId, null);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error("Calendar sync failed:", err);
    await prisma.syncState.upsert({
      where: stateKey,
      update: { status: "ERROR", lastError: String(err.message ?? err) },
      create: { userId, calendarId: CALENDAR_ID, status: "ERROR", lastError: String(err.message ?? err) },
    });
    throw err;
  }

  const now = new Date();
  await prisma.syncState.upsert({
    where: stateKey,
    update: { syncToken: result.nextSyncToken, lastSyncedAt: now, status: "IDLE", lastError: null },
    create: { userId, calendarId: CALENDAR_ID, syncToken: result.nextSyncToken, lastSyncedAt: now, status: "IDLE" },
  });

  return { connected: true, changed: result.changed, lastSyncedAt: now };
}

// syncToken = null -> full sync of a date window; otherwise only what changed since last time
async function pull(calendar, userId, syncToken) {
  let pageToken;
  let nextSyncToken = null;
  let changed = 0;

  do {
    const params = { calendarId: CALENDAR_ID, singleEvents: true, maxResults: 250, pageToken };
    if (syncToken) {
      params.syncToken = syncToken; // can't be combined with timeMin/timeMax
    } else {
      params.timeMin = new Date(Date.now() - 30 * DAY).toISOString();
      params.timeMax = new Date(Date.now() + 90 * DAY).toISOString();
      params.showDeleted = true;
    }

    const { data } = await calendar.events.list(params);

    // save in small parallel batches instead of one by one
    const items = data.items ?? [];
    for (let i = 0; i < items.length; i += BATCH) {
      const results = await Promise.all(
        items.slice(i, i + BATCH).map((ev) => applyEvent(userId, ev))
      );
      changed += results.filter(Boolean).length;
    }

    pageToken = data.nextPageToken;
    nextSyncToken = data.nextSyncToken ?? nextSyncToken; // only sent on the last page
  } while (pageToken);

  return { changed, nextSyncToken };
}

async function applyEvent(userId, ev) {
  // cancelled in Google -> soft delete here
  if (ev.status === "cancelled") {
    const res = await prisma.event.updateMany({
      where: { userId, googleCalendarId: CALENDAR_ID, googleEventId: ev.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return res.count > 0;
  }

  const startRaw = ev.start?.dateTime || ev.start?.date;
  const endRaw = ev.end?.dateTime || ev.end?.date;
  if (!startRaw || !endRaw) return false;

  const fields = {
    title: ev.summary || "(No title)",
    description: ev.description ?? null,
    startAt: new Date(startRaw),
    endAt: new Date(endRaw),
    allDay: !!ev.start?.date,
    etag: ev.etag ?? null,
    deletedAt: null,
  };

  await prisma.event.upsert({
    where: {
      userId_googleCalendarId_googleEventId: {
        userId,
        googleCalendarId: CALENDAR_ID,
        googleEventId: ev.id,
      },
    },
    update: fields,
    create: { ...fields, userId, source: "GCAL", googleCalendarId: CALENDAR_ID, googleEventId: ev.id },
  });
  return true;
}