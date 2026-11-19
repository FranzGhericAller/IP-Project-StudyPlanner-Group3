import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EventForm from "@/components/forms/EventForm";

export const dynamic = "force-dynamic";

// loads the event then reuses the same form as Add Event
export default async function EditEventPage({ params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  // userId in the where = can't open someone else's event
  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: { subject: true },
  });
  if (!event) notFound();

  return (
    <EventForm
      eventId={event.id}
      linked={Boolean(event.googleEventId)}
      allDay={event.allDay}
      initial={{
        title: event.title,
        subject: event.subject?.name ?? "",
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        description: event.description ?? "",
      }}
    />
  );
}