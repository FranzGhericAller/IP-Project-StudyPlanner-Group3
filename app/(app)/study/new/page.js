import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StudyForm from "@/components/StudyForm";

export const dynamic = "force-dynamic";

export default async function LogStudyPage() {
  const session = await auth();

  // Open tasks the session can be linked to.
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id, status: "TODO" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true },
  });

  return <StudyForm tasks={tasks} />;
}