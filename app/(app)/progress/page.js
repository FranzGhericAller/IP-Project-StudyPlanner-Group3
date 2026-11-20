import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BackLink from "@/components/common/BackLink";
import ProgressView from "@/components/progress/ProgressView";
import { buildProgress } from "@/lib/progress";

export const dynamic = "force-dynamic"; // always fresh data, no caching

// Progress: weekly goal, streak, this week by day and hours per subject.
export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [user, sessions, subjects, doneTasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, weeklyGoalMin: true },
    }),
    // finished study sessions only (a running timer has no end yet)
    prisma.studySession.findMany({
      where: { userId, endedAt: { not: null }, durationMin: { gt: 0 } },
      orderBy: { startedAt: "desc" },
      take: 10000,
      select: {
        startedAt: true,
        durationMin: true,
        subjectId: true,
        task: { select: { subjectId: true } },
      },
    }),
    prisma.subject.findMany({ where: { userId }, select: { id: true, name: true } }),
    prisma.task.findMany({
      where: { userId, status: "DONE" },
      take: 10000,
      select: { subjectId: true, completedAt: true },
    }),
  ]);

  const data = buildProgress({
    sessions: sessions.map((s) => ({
      startedAt: s.startedAt,
      durationMin: s.durationMin,
      // the session's own subject, otherwise its task's subject
      subjectId: s.subjectId ?? s.task?.subjectId ?? null,
    })),
    subjectNames: Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    doneTasks,
    tz: user?.timezone || "Asia/Manila",
    goalMin: user?.weeklyGoalMin ?? 600,
  });

  return (
    <div className="min-h-screen">
      <BackLink title="Progress" />
      <ProgressView data={data} />
    </div>
  );
}