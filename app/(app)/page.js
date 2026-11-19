import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Dashboard from "@/components/dashboard/Dashboard";
import { resourceSelect } from "@/lib/resources";

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
  const [openTasks, doneTasks, total, completed, upcoming, studyTotal, dueTasks, events, recentRows, resourceCount, studyRows] =
    await Promise.all([
      // sidebar list (sorted below)
      prisma.task.findMany({
        where: { userId, status: "TODO" },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { subject: { select: { name: true } } },
      }),
      // "Completed" section in the sidebar
      prisma.task.findMany({
        where: { userId, status: "DONE" },
        orderBy: { completedAt: "desc" },
        take: 15,
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
      prisma.resource.findMany({
        where: { userId, OR: [{ eventId: null }, { event: { deletedAt: null } }] },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: resourceSelect,
      }),
      prisma.resource.count({
        where: { userId, OR: [{ eventId: null }, { event: { deletedAt: null } }] },
      }),
      prisma.studySession.findMany({
        where: { userId, endedAt: { not: null }, startedAt: { gte: from, lte: to } },
        orderBy: { startedAt: "desc" },
        take: 300,
        select: {
          id: true,
          startedAt: true,
          durationMin: true,
          task: { select: { title: true } },
          subject: { select: { name: true } },
        },
      }),
    ]);

  // soonest due date first, tasks without a due date after those (newest first)
  const sortedOpen = [...openTasks].sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt;
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return b.createdAt - a.createdAt;
  });

  const toItem = (t) => ({
    id: t.id,
    name: t.title,
    subject: t.subject?.name ?? "",
    priority: t.priority,
    linked: Boolean(t.googleTaskId), // true = also in Google Tasks
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  });

  const tasks = sortedOpen.slice(0, 30).map(toItem);
  const completedTasks = doneTasks.map(toItem);

  const recentResources = recentRows.map((r) => ({
    id: r.id,
    provider: r.provider,
    title: r.title,
    url: r.url,
  }));

  const stats = {
    total,
    completed,
    upcoming,
    minutes: studyTotal._sum.durationMin ?? 0,
  };

  // tasks + events in one list. dates -> ISO strings so they can be sent to the browser.
  // refId = the real database id (the side panel uses it to load the details)
  const calendarItems = [
    ...dueTasks.map((t) => ({
      id: `task-${t.id}`,
      refId: t.id,
      kind: "task",
      title: t.title,
      at: t.dueAt.toISOString(),
      priority: t.priority,
      done: t.status === "DONE",
      linked: Boolean(t.googleTaskId),
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      refId: e.id,
      kind: "event",
      title: e.title,
      at: e.startAt.toISOString(),
      linked: Boolean(e.googleEventId),
    })),
        ...studyRows.map((s) => ({
      id: `study-${s.id}`,
      refId: s.id,
      kind: "study",
      title: s.task?.title ?? s.subject?.name ?? "Study session",
      at: s.startedAt.toISOString(),
      minutes: s.durationMin,
    })),
  ];

  return (
    <Dashboard
      tasks={tasks}
      completedTasks={completedTasks}
      stats={stats}
      calendarItems={calendarItems}
      recentResources={recentResources}
      resourceCount={resourceCount}
    />
  );
}