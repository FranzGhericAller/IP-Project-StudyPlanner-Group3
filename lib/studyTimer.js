// shared by the study timer routes

export const activeInclude = {
  task: { select: { title: true } },
  subject: { select: { name: true } },
};

// what the browser needs to show a running timer.
// serverNow lets the browser correct for a clock that is a bit off
export function toActive(session) {
  return {
    id: session.id,
    startedAt: session.startedAt.toISOString(),
    taskId: session.taskId,
    title: session.task?.title ?? session.subject?.name ?? "Study session",
    serverNow: new Date().toISOString(),
  };
}