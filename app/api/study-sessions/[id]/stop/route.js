import { prisma } from "@/lib/db";
import { getUserId, unauthorized, notFound, serverError } from "@/lib/apiHelpers";

const MAX_MINUTES = 1440; // same limit as the manual log form (24 hours)

// POST /api/study-sessions/:id/stop: stop the timer and save the minutes
export async function POST(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const session = await prisma.studySession.findFirst({
      where: { id, userId, endedAt: null },
    });
    if (!session) return notFound();

    const now = new Date();
    const raw = Math.floor((now.getTime() - session.startedAt.getTime()) / 60000);

    // under a minute = not worth saving
    if (raw < 1) {
      await prisma.studySession.deleteMany({ where: { id, userId } });
      return Response.json({ ok: true, discarded: true, minutes: 0 });
    }

    // a timer someone forgot overnight is capped at 24 hours
    const minutes = Math.min(raw, MAX_MINUTES);
    const endedAt = raw > MAX_MINUTES ? new Date(session.startedAt.getTime() + MAX_MINUTES * 60000) : now;

    await prisma.studySession.updateMany({
      where: { id, userId, endedAt: null },
      data: { endedAt, durationMin: minutes },
    });
    return Response.json({ ok: true, minutes });
  } catch (e) {
    console.error("Stop timer failed:", e);
    return serverError();
  }
}