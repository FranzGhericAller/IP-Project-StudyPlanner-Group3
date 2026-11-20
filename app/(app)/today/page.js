import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TodayView from "@/components/today/TodayView";
import { buildToday, queryWindow } from "@/lib/today";

export const dynamic = "force-dynamic"; // always fresh data, no caching

// Today view. Runs on the server so we can read the db with prisma.
// lib/today.js sorts the rows into days (in the user's timezone) and the client component draws them.
export default async function TodayPage() {
  // layout and page load at the same time in Next, so check login here too
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const { from, to, examTo, studySince } = queryWindow(now);
  const withSubject = { subject: { select: { name: true } } };

  // run all queries at once
  const [tasks, events, examTasks, examEvents, sessions, me] = await Promise.all([
    // open tasks due before the window ends (this includes everything overdue),
    // plus done tasks inside the window so a checked task can be un-checked
    prisma.task.findMany({
      where: {
        userId,
        OR: [
          { status: "TODO", dueAt: { lt: to } },
          { status: "DONE", dueAt: { gte: from, lt: to } },
        ],
      },
      orderBy: { dueAt: "desc" }, // if there is a huge backlog, keep the newest rows
      take: 400,
      include: withSubject,
    }),
    prisma.event.findMany({
      where: { userId, deletedAt: null, startAt: { gte: from, lt: to } },
      include: withSubject,
    }),
    // exams can be weeks away, so they get their own queries
    prisma.task.findMany({
      where: { userId, isExam: true, status: "TODO", dueAt: { gte: from, lt: examTo } },
      orderBy: { dueAt: "asc" },
      take: 12,
      include: withSubject,
    }),
    prisma.event.findMany({
      where: { userId, isExam: true, deletedAt: null, endAt: { gte: now }, startAt: { lt: examTo } },
      orderBy: { startAt: "asc" },
      take: 12,
      include: withSubject,
    }),
    prisma.studySession.findMany({
      where: {
        userId,
        endedAt: { not: null },
        durationMin: { gt: 0 },
        startedAt: { gte: studySince },
      },
      select: {
        startedAt: true,
        durationMin: true,
        subjectId: true,
        task: { select: { subjectId: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);

  const data = buildToday({
    tasks,
    events,
    examTasks,
    examEvents,
    sessions,
    tz: me?.timezone,
    now,
  });

  return <TodayView data={data} />;
}