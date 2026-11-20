import { prisma } from "@/lib/db";
import { taskSchema } from "@/lib/validators";
import { getSubjectId } from "@/lib/subjects";
import { pushTaskCreate } from "@/lib/pushTasks";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// GET /api/tasks: all my tasks, newest first
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  try {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { subject: { select: { name: true } } },
    });
    return Response.json({ tasks });
  } catch (e) {
    console.error("List tasks failed:", e);
    return serverError();
  }
}

// POST /api/tasks: add a task (also created in Google Tasks if connected)
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { title, subject, dueAt, priority, notes, isExam } = parsed.data;

  try {
    const subjectId = await getSubjectId(userId, subject);
    const task = await prisma.task.create({
      data: { userId, subjectId, title, notes: notes || null, priority, dueAt, isExam: isExam ?? false },
    });
    await pushTaskCreate(userId, task.id); // never throws, a Google problem won't block saving
    return Response.json({ ok: true, task }, { status: 201 });
  } catch (e) {
    console.error("Create task failed:", e);
    return serverError();
  }
}