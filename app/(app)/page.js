import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Dashboard from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic"; // always fresh data, no caching

const DAY = 24 * 60 * 60 * 1000; // 1 day in ms

// Dashboard. Runs on the server so we can read the db directly w/ prisma,
// then pass plain data to the <Dashboard> client component.
export default async function DashboardPage() {
  // layout and page load at the same time in Next, so check login here too
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY);

  // load 2 months back to 6 months ahead so the calendar can browse w/o refetching
  const from = new Date(now.getTime() - 60 * DAY);
  const to = new Date(now.getTime() + 180 * DAY);

  // run all queries at once
  const [openTasks, total, completed, upcoming, studyTotal, dueTasks, events] =
    await Promise.all([
      // sidebar list
      prisma.task.findMany({
        where: { userId, status: "TODO" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { subject: { select: { name: true } } },
      }),
      // progress box
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "DONE" } }),
      prisma.task.count({
        where: { userId, status: "TODO", dueAt: { gte: now, lte: weekAhead } },
      }),
      prisma.studySession.aggregate({ where: { userId }, _sum: { durationMin: true } }),
      // calendar
      prisma.task.findMany({ where: { userId, dueAt: { gte: from, lte: to } } }),
      prisma.event.findMany({
        where: { userId, deletedAt: null, startAt: { gte: from, lte: to } },
      }),
    ]);

  const tasks = openTasks.map((t) => ({
    id: t.id,
    name: t.title,
    subject: t.subject?.name ?? "",
    priority: t.priority,
  }));

  const stats = {
    total,
    completed,
    upcoming,
    minutes: studyTotal._sum.durationMin ?? 0,
  };

  // tasks + events in one list. dates -> ISO strings so they can be sent to the browser
  const calendarItems = [
    ...dueTasks.map((t) => ({
      id: `task-${t.id}`,
      kind: "task",
      title: t.title,
      at: t.dueAt.toISOString(),
      priority: t.priority,
      done: t.status === "DONE",
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      kind: "event",
      title: e.title,
      at: e.startAt.toISOString(),
      source: e.source === "GCAL" ? "gcal" : "local",
    })),
  ];

  return <Dashboard tasks={tasks} stats={stats} calendarItems={calendarItems} />;
}
