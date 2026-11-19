import { prisma } from "@/lib/db";
import { getGoogleAuth, getTasksClient } from "@/lib/googleCalendar";
import { dateKey } from "@/lib/googleDates";

const BATCH = 5; // rows saved at the same time
const DAY = 86400000;

// pull Google Tasks -> our Task table (all of the user's task lists)
export async function syncUserTasks(userId) {
  const g = await getGoogleAuth(userId);
  if (!g) return { connected: false, changed: 0, needsReconnect: false };

  const tasks = await getTasksClient(userId);
  if (!tasks) return { connected: true, changed: 0, needsReconnect: true };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  const tz = user?.timezone || "Asia/Manila";

  const startedAt = new Date();
  let changed = 0;

  const { data: lists } = await tasks.tasklists.list({ maxResults: 100 });
  for (const list of lists.items ?? []) {
    // one SyncState row per task list, calendarId = "tasks:<listId>"
    const stateKey = { userId_calendarId: { userId, calendarId: `tasks:${list.id}` } };
    const state = await prisma.syncState.findUnique({ where: stateKey });
    const ctx = { tz, firstSync: !state?.lastSyncedAt };

    let pageToken;
    do {
      const { data } = await tasks.tasks.list({
        tasklist: list.id,
        showCompleted: true,
        showHidden: true,   // tasks completed in other Google apps are "hidden"
        showDeleted: true,
        maxResults: 100,
        pageToken,
        updatedMin: state?.lastSyncedAt ? state.lastSyncedAt.toISOString() : undefined,
      });

      const items = data.items ?? [];
      for (let i = 0; i < items.length; i += BATCH) {
        const results = await Promise.all(
          items.slice(i, i + BATCH).map((t) => applyTask(userId, list.id, t, ctx))
        );
        changed += results.filter(Boolean).length;
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    await prisma.syncState.upsert({
      where: stateKey,
      update: { lastSyncedAt: startedAt, status: "IDLE", lastError: null },
      create: { userId, calendarId: `tasks:${list.id}`, lastSyncedAt: startedAt, status: "IDLE" },
    });
  }

  return { connected: true, changed, needsReconnect: false };
}

async function applyTask(userId, listId, t, { tz, firstSync }) {
  const key = { userId, googleTaskListId: listId, googleTaskId: t.id };

  // deleted in Google -> remove here
  if (t.deleted) {
    const res = await prisma.task.deleteMany({ where: key });
    return res.count > 0;
  }

  const done = t.status === "completed";

  // first sync: don't import old finished tasks (older than 30 days)
  if (firstSync && done && t.completed && Date.now() - new Date(t.completed).getTime() > 30 * DAY) {
    return false;
  }

  const existing = await prisma.task.findUnique({
    where: { userId_googleTaskListId_googleTaskId: key },
    select: { dueAt: true },
  });

  // Google only keeps the date. if it's the same day we already have, keep our time
  let dueAt = t.due ? new Date(t.due) : null;
  if (dueAt && existing?.dueAt && dateKey(existing.dueAt, tz) === t.due.slice(0, 10)) {
    dueAt = existing.dueAt;
  }

  const fields = {
    title: (t.title || "(No title)").slice(0, 191), // title column is VARCHAR(191)
    notes: t.notes ?? null,
    dueAt,
    status: done ? "DONE" : "TODO",
    completedAt: done && t.completed ? new Date(t.completed) : null,
  };

  await prisma.task.upsert({
    where: { userId_googleTaskListId_googleTaskId: key },
    update: fields, // priority is not touched, so your local priority survives
    create: { ...fields, ...key, source: "GTASKS", priority: "MED" },
  });
  return true;
}