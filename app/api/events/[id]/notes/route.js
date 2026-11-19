import { prisma } from "@/lib/db";
import { notesSchema } from "@/lib/validators";
import { pushEventUpdate } from "@/lib/pushEvents";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  notFound,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// PUT /api/events/:id/notes: save notes (= the event description, also sent to Google)
export async function PUT(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = notesSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await prisma.event.updateMany({
      where: { id, userId, deletedAt: null },
      data: { description: parsed.data.notes || null },
    });
    if (result.count === 0) return notFound();
    await pushEventUpdate(userId, id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Save event notes failed:", e);
    return serverError();
  }
}