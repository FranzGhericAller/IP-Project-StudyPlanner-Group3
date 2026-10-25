import { prisma } from "@/lib/db";
import { taskSchema } from "@/lib/validators/task";
import { getSubjectId } from "@/lib/subjects";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  validationError,
  serverError,
} from "@/lib/api";

// Create a task
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { title, subject, dueAt, priority, notes } = parsed.data;

  try {
    const subjectId = await getSubjectId(userId, subject);
    const task = await prisma.task.create({
      data: { userId, subjectId, title, notes: notes || null, priority, dueAt },
    });
    return Response.json({ ok: true, task }, { status: 201 });
  } catch (e) {
    console.error("Create task failed:", e);
    return serverError();
  }
}