import { prisma } from "@/lib/db";
import { driveLinkSchema } from "@/lib/validators";
import { parseDriveLink, resolveTarget, resourceSelect } from "@/lib/resources";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  notFound,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

// POST /api/resources: attach a Google Drive link to a task or event
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = driveLinkSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { targetType, targetId, url, title } = parsed.data;

  const drive = parseDriveLink(url);
  if (!drive) {
    return Response.json(
      { errors: { url: "Paste a link from drive.google.com or docs.google.com." } },
      { status: 400 }
    );
  }

  try {
    const target = await resolveTarget(userId, targetType, targetId);
    if (!target) return notFound();

    const resource = await prisma.resource.create({
      data: {
        userId,
        ...target, // taskId / eventId / subjectId
        provider: "DRIVE",
        title: title || drive.label,
        url: drive.url,
        externalId: drive.externalId,
      },
      select: resourceSelect,
    });
    return Response.json({ ok: true, resource }, { status: 201 });
  } catch (e) {
    console.error("Add Drive link failed:", e);
    return serverError();
  }
}