import { prisma } from "@/lib/db";
import { studySchema } from "@/lib/validators";
import { getSubjectId } from "@/lib/subjects";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// POST /api/study-sessions: log study time
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = studySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { minutes, subject, taskId } = parsed.data;

  // no start time = just finished studying now
  const startedAt = parsed.data.startedAt ?? new Date();
  const endedAt = new Date(startedAt.getTime() + minutes * 60 * 1000);

  try {
    // if a task was picked, make sure it's actually this user's task
    let task = null;
    if (taskId) {
      task = await prisma.task.findFirst({ where: { id: taskId, userId } });
      if (!task) {
        return Response.json({ errors: { taskId: "Task not found." } }, { status: 400 });
      }
    }

    // typed subject wins, otherwise use the task's subject
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
