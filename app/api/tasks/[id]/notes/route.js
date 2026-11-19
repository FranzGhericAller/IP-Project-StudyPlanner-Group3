import { prisma } from "@/lib/db";
import { notesSchema } from "@/lib/validators";
import { pushTaskUpdate } from "@/lib/pushTasks";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  notFound,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// PUT /api/tasks/:id/notes: save notes (also sent to Google Tasks if linked)
export async function PUT(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = notesSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await prisma.task.updateMany({
      where: { id, userId },
      data: { notes: parsed.data.notes || null },
    });
    if (result.count === 0) return notFound();
    await pushTaskUpdate(userId, id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Save task notes failed:", e);
    return serverError();
  }
}