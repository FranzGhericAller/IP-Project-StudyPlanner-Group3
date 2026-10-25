import { prisma } from "@/lib/db";
import { studySchema } from "@/lib/validators/study";
import { getSubjectId } from "@/lib/subjects";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  validationError,
  serverError,
} from "@/lib/api";

// Log study time
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = studySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { minutes, subject, taskId } = parsed.data;
  const startedAt = parsed.data.startedAt ?? new Date();
  const endedAt = new Date(startedAt.getTime() + minutes * 60 * 1000);

  try {
    // If a task was picked, make sure it belongs to this user.
    let task = null;
    if (taskId) {
      task = await prisma.task.findFirst({
        where: { id: taskId, userId },
        select: { id: true, subjectId: true },
      });
      if (!task) {
        return Response.json({ errors: { taskId: "Task not found." } }, { status: 400 });
      }
    }

    // A typed subject wins; otherwise use the task's subject.
    const subjectId = subject
      ? await getSubjectId(userId, subject)
      : task?.subjectId ?? null;

    const session = await prisma.studySession.create({
      data: {
        userId,
        subjectId,
        taskId: task?.id ?? null,
        startedAt,
        endedAt,
        durationMin: minutes,
      },
    });
    return Response.json({ ok: true, session }, { status: 201 });
  } catch (e) {
    console.error("Log study session failed:", e);
    return serverError();
  }
}