import { prisma } from "@/lib/db";
import { eventSchema } from "@/lib/validators";
import { getSubjectId } from "@/lib/subjects";
import { pushEventUpdate, pushEventDelete } from "@/lib/pushEvents";
import { resourceSelect } from "@/lib/resources";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  notFound,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// GET /api/events/:id: details for the side panel
export async function GET(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        subject: { select: { name: true } },
        resources: { select: resourceSelect, orderBy: { createdAt: "desc" } },
      },
    });
    if (!event) return notFound();
    return Response.json({ event });
  } catch (e) {
    console.error("Load event failed:", e);
    return serverError();
  }
}

// PUT /api/events/:id: edit an event
export async function PUT(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { title, subject, description, startAt, endAt } = parsed.data;

  try {
    const subjectId = await getSubjectId(userId, subject);
    const result = await prisma.event.updateMany({
      where: { id, userId, deletedAt: null },
      data: { title, subjectId, description: description || null, startAt, endAt },
    });
    if (result.count === 0) return notFound();
    await pushEventUpdate(userId, id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Edit event failed:", e);
    return serverError();
  }
}

// DELETE /api/events/:id
export async function DELETE(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId, deletedAt: null },
      select: { googleEventId: true },
    });
    if (!event) return notFound();

    if (event.googleEventId) {
      // linked to Google: delete there, then hide it here (soft delete)
      await pushEventDelete(userId, id);
      await prisma.event.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
    } else {
      await prisma.event.deleteMany({ where: { id, userId } });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Delete event failed:", e);
    return serverError();
  }
}