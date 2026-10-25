import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TaskForm from "@/components/TaskForm";
import { PRIORITY_LABEL } from "@/lib/priority";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }) {
  const { id } = await params;
  const session = await auth();

  // `userId` in the where clause means you can't open someone else's task.
  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: { subject: true },
  });
  if (!task) notFound();

  return (
    <TaskForm
      taskId={task.id}
      initial={{
        title: task.title,
        subject: task.subject?.name ?? "",
        dueAt: task.dueAt ? task.dueAt.toISOString() : "",
        priority: PRIORITY_LABEL[task.priority],
        notes: task.notes ?? "",
      }}
    />
  );
}