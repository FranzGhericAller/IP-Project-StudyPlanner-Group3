import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BackLink from "@/components/common/BackLink";
import ResourceLibrary from "@/components/resources/ResourceLibrary";

export const dynamic = "force-dynamic"; // always fresh data, no caching

// Resource Center: everything attached to your tasks and events, grouped by subject.
export default async function ResourceCenter() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const rows = await prisma.resource.findMany({
    // hide attachments of events that were deleted
    where: { userId, OR: [{ eventId: null }, { event: { deletedAt: null } }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      title: true,
      url: true,
      sizeBytes: true,
      createdAt: true,
      subject: { select: { name: true } },
      task: { select: { title: true, subject: { select: { name: true } } } },
      event: { select: { title: true, subject: { select: { name: true } } } },
    },
  });

  // plain data only (dates -> strings) so it can go to the browser
  const resources = rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    title: r.title,
    url: r.url,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
    // the subject of the task/event it is attached to wins, since that can change later
    subject: r.task?.subject?.name ?? r.event?.subject?.name ?? r.subject?.name ?? "",
    attachedTo: r.task
      ? { kind: "task", title: r.task.title }
      : r.event
      ? { kind: "event", title: r.event.title }
      : null,
  }));

  return (
    <div className="min-h-screen">
      <BackLink title="Resource Center" />
      <ResourceLibrary resources={resources} />
    </div>
  );
}