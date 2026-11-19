import { prisma } from "@/lib/db";
import { settingsSchema } from "@/lib/validators";
import {
  getUserId,
  readJson,
  unauthorized,
  badRequest,
  validationError,
  serverError,
} from "@/lib/apiHelpers";

const select = {
  emailNotifications: true,
  darkMode: true,
  autoSync: true,
  autoSyncMinutes: true,
};

// GET /api/settings
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  try {
    const settings = await prisma.user.findUnique({ where: { id: userId }, select });
    return Response.json({ settings });
  } catch (e) {
    console.error("Load settings failed:", e);
    return serverError();
  }
}

// PATCH /api/settings: save one or more settings
export async function PATCH(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const settings = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select,
    });
    return Response.json({ ok: true, settings });
  } catch (e) {
    console.error("Save settings failed:", e);
    return serverError();
  }
}