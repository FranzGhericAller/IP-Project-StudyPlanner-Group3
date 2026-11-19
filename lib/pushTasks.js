import { prisma } from "@/lib/db";
import { getTasksClient } from "@/lib/googleCalendar";
import { toGoogleDue } from "@/lib/googleDates";

async function userTimezone(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return u?.timezone || "Asia/Manila";
}

// a task that is already linked to a Google task
async function loadLinked(userId, taskId) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId, googleTaskId: { not: null } },
  });
  if (!task) return null;
  const client = await getTasksClient(userId);
  return client ? { task, client } : null;
}

// new task made in the app -> also create it in Google Tasks (first list = "My Tasks")
export async function pushTaskCreate(userId, taskId) {
  try {
    const client = await getTasksClient(userId);
    if (!client) return; // not connected to Google, keep it local

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId, googleTaskId: null },
    });
    if (!task) return;

    const { data: lists } = await client.tasklists.list({ maxResults: 1 });
    const list = lists.items?.[0];
    if (!list) return;

    const tz = await userTimezone(userId);
    const { data: created } = await client.tasks.insert({
      tasklist: list.id,
      requestBody: {
        title: task.title,
        notes: task.notes ?? undefined,
        due: task.dueAt ? toGoogleDue(task.dueAt, tz) : undefined,
      },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { googleTaskListId: list.id, googleTaskId: created.id },
    });
  } catch (err) {
    console.error("Push task create failed:", err);
  }
}

// title / notes / due date edited in the app
export async function pushTaskUpdate(userId, taskId) {
  try {
    const found = await loadLinked(userId, taskId);
    if (!found) return;
    const { task, client } = found;
    const tz = await userTimezone(userId);

    await client.tasks.patch({
      tasklist: task.googleTaskListId,
      task: task.googleTaskId,
      requestBody: {
        title: task.title,
        notes: task.notes ?? "",
        due: task.dueAt ? toGoogleDue(task.dueAt, tz) : null, // null clears the due date
      },
    });
  } catch (err) {
    console.error("Push task update failed:", err);
  }
}

// done / not done
export async function pushTaskStatus(userId, taskId) {
  try {
    const found = await loadLinked(userId, taskId);
    if (!found) return;
    const { task, client } = found;
    await client.tasks.patch({
      tasklist: task.googleTaskListId,
      task: task.googleTaskId,
      requestBody:
        task.status === "DONE"
          ? { status: "completed" }
          : { status: "needsAction", completed: null }, // null = undo completion
    });
  } catch (err) {
    console.error("Push task status failed:", err);
  }
}

// call BEFORE deleting the local row (we need its Google ids)
export async function pushTaskDelete(userId, taskId) {
  try {
    const found = await loadLinked(userId, taskId);
    if (!found) return;
    await found.client.tasks.delete({
      tasklist: found.task.googleTaskListId,
      task: found.task.googleTaskId,
    });
  } catch (err) {
    console.error("Push task delete failed:", err);
  }
}