import { prisma } from "@/lib/db";
import { getUserId, unauthorized, notFound, serverError } from "@/lib/apiHelpers";

// DELETE /api/study-sessions/:id: throw away a RUNNING timer (saved sessions are never deleted here)
export async function DELETE(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const result = await prisma.studySession.deleteMany({ where: { id, userId, endedAt: null } });
    if (result.count === 0) return notFound();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Discard timer failed:", e);
    return serverError();
  }
}