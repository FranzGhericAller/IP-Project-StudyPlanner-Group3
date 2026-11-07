import { prisma } from "@/lib/db";
import { taskSchema, taskStatusSchema } from "@/lib/validators";
import { getSubjectId } from "@/lib/subjects";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  notFound,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// NOTE: every query here has userId in the "where", so you can only touch your own tasks
// even if you guess someone else's id. count === 0 means not found (or not yours).

// PATCH /api/tasks/:id: mark done / not done
export async function PATCH(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = taskStatusSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { status } = parsed.data;

  try {
    const result = await prisma.task.updateMany({
      where: { id, userId },
      data: { status, completedAt: status === "DONE" ? new Date() : null },
    });
    if (result.count === 0) return notFound();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Update task status failed:", e);
    return serverError();
  }
}

// PUT /api/tasks/:id: edit a task
export async function PUT(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { title, subject, dueAt, priority, notes } = parsed.data;

  try {
    const subjectId = await getSubjectId(userId, subject);
    const result = await prisma.task.updateMany({
      where: { id, userId },
      data: { title, subjectId, notes: notes || null, priority, dueAt },
    });
    if (result.count === 0) return notFound();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Edit task failed:", e);
    return serverError();
  }
}

// DELETE /api/tasks/:id
export async function DELETE(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const result = await prisma.task.deleteMany({ where: { id, userId } });
    if (result.count === 0) return notFound();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Delete task failed:", e);
    return serverError();
  }
}
