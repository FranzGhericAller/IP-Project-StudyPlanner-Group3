import { prisma } from "@/lib/db";
import { eventSchema } from "@/lib/validators/event";
import { getSubjectId } from "@/lib/subjects";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  validationError,
  serverError,
} from "@/lib/api";

// Create a local calendar event
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { title, subject, description, startAt, endAt } = parsed.data;

  try {
    const subjectId = await getSubjectId(userId, subject);
    const event = await prisma.event.create({
      data: {
        userId,
        subjectId,
        title,
        description: description || null,
        startAt,
        endAt,
        source: "LOCAL",
      },
    });
    return Response.json({ ok: true, event }, { status: 201 });
  } catch (e) {
    console.error("Create event failed:", e);
    return serverError();
  }
}