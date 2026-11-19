import { prisma } from "@/lib/db";
import { activeInclude, toActive } from "@/lib/studyTimer";
import { getUserId, unauthorized, serverError } from "@/lib/apiHelpers";

// GET /api/study-sessions/active: the timer that is running right now (or null)
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  try {
    const session = await prisma.studySession.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
      include: activeInclude,
    });
    return Response.json({ active: session ? toActive(session) : null });
  } catch (e) {
    console.error("Load active timer failed:", e);
    return serverError();
  }
}