import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StudyForm from "@/components/forms/StudyForm";

export const dynamic = "force-dynamic";

export default async function LogStudyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // open tasks for the "linked task" dropdown
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id, status: "TODO" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true },
  });

  return <StudyForm tasks={tasks} />;
}
