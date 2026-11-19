import { prisma } from "@/lib/db";
import { startTimerSchema } from "@/lib/validators";
import { getSubjectId } from "@/lib/subjects";
import { activeInclude, toActive } from "@/lib/studyTimer";
import {
  getUserId,
  readJson,
  unauthorized,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// POST /api/study-sessions/start: start a timer. a running timer = a session with no endedAt
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await readJson(request)) ?? {};
  const parsed = startTimerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { taskId, subject } = parsed.data;

  try {
    // only one timer at a time
    const running = await prisma.studySession.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
      include: activeInclude,
    });
    if (running) {
      return Response.json(
        { message: "A timer is already running.", active: toActive(running) },
        { status: 409 }
      );
    }

    // if a task was picked, make sure it's this user's task
    let task = null;
    if (taskId) {
      task = await prisma.task.findFirst({ where: { id: taskId, userId } });
      if (!task) {
        return Response.json({ message: "Task not found." }, { status: 400 });
      }
    }

    const subjectId = subject ? await getSubjectId(userId, subject) : task?.subjectId ?? null;

    const created = await prisma.studySession.create({
      data: {
        userId,
        subjectId,
        taskId: task?.id ?? null,
        startedAt: new Date(),
        endedAt: null,
        durationMin: 0,
      },
      include: activeInclude,
    });
    return Response.json({ ok: true, active: toActive(created) }, { status: 201 });
  } catch (e) {
    console.error("Start timer failed:", e);
    return serverError();
  }
}