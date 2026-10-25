import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic"; // always fetch fresh data

// Database stores HIGH/MED/LOW, but your priorityStyles keys are High/Med/Low.
const PRIORITY_LABEL = { HIGH: "High", MED: "Med", LOW: "Low" };
const DAY = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session.user.id; // the (app) layout already guarantees a session

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY);

  // The calendar can browse this window without asking the server again.
  const from = new Date(now.getTime() - 60 * DAY);
  const to = new Date(now.getTime() + 180 * DAY);

  const [openTasks, total, completed, upcoming, minutes, dueTasks, events] =
    await Promise.all([
      prisma.task.findMany({
        where: { userId, status: "TODO" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "DONE" } }),
      prisma.task.count({
        where: { userId, status: "TODO", dueAt: { gte: now, lte: weekAhead } },
      }),
      prisma.studySession.aggregate({
        where: { userId },
        _sum: { durationMin: true },
      }),
      // Tasks that have a due date, for the calendar
      prisma.task.findMany({
        where: { userId, dueAt: { gte: from, lte: to } },
      }),
      // Calendar events (not created from the app yet, but ready for it)
      prisma.event.findMany({
        where: { userId, deletedAt: null, startAt: { gte: from, lte: to } },
      }),
    ]);

  // Only pass plain, simple values to the client component.
  const tasks = openTasks.map((t) => ({
    id: t.id,
    name: t.title,
    priority: PRIORITY_LABEL[t.priority],
  }));

  const stats = {
    total,
    completed,
    upcoming,
    minutes: minutes._sum.durationMin ?? 0,
  };

  // One list for the calendar. Dates become ISO strings so they can cross to the browser.
  const calendarItems = [
    ...dueTasks.map((t) => ({
      id: `task-${t.id}`,
      kind: "task",
      title: t.title,
      at: t.dueAt.toISOString(),
      priority: PRIORITY_LABEL[t.priority],
      done: t.status === "DONE",
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      kind: "event",
      title: e.title,
      at: e.startAt.toISOString(),
      // Keys of eventTypeStyles in lib/data.js
      type: e.source === "GCAL" ? "gcal" : "physics",
    })),
  ];

  return <Dashboard tasks={tasks} stats={stats} calendarItems={calendarItems} />;
}