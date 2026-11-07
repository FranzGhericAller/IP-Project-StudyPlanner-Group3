import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TaskForm from "@/components/forms/TaskForm";

export const dynamic = "force-dynamic";

// loads the task then reuses the same form as Add Task
export default async function EditTaskPage({ params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  // userId in the where = can't open someone else's task
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
        priority: task.priority,
        notes: task.notes ?? "",
      }}
    />
  );
}
