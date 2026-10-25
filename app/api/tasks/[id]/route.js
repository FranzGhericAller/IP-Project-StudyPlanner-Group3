import { prisma } from "@/lib/db";
import { taskSchema, taskStatusSchema } from "@/lib/validators/task";
import { getSubjectId } from "@/lib/subjects";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  notFound,
  validationError,
  serverError,
} from "@/lib/api";

// Every query below has `userId` in its where clause, so a user can
// only touch their own tasks even if they guess someone else's task id.

// Mark a task done / not done
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

// Edit a task
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

// Delete a task
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