import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ALLOWED_TYPES,
  MAX_FILE_BYTES,
  cleanFileName,
  resolveTarget,
  resourceSelect,
  safePath,
} from "@/lib/resources";
import { getUserId, unauthorized, badRequest, notFound, serverError } from "@/lib/apiHelpers";

export const runtime = "nodejs"; // we write to disk

// POST /api/resources/upload  (multipart: file, targetType, targetId)
export async function POST(request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  let form;
  try {
    form = await request.formData();
  } catch {
    return badRequest();
  }

  const file = form.get("file");
  const targetType = String(form.get("targetType") ?? "");
  const targetId = String(form.get("targetId") ?? "");

  const fail = (msg) => Response.json({ errors: { file: msg } }, { status: 400 });

  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return fail("Choose a file.");
  }
  if (file.size > MAX_FILE_BYTES) return fail("File is too large (max 10 MB).");

  const original = cleanFileName(file.name);
  const ext = path.extname(original).toLowerCase();
  const mime = ALLOWED_TYPES[ext];
  if (!mime) return fail("That file type isn't allowed. Use PDF, Office files, images, text or zip.");

  try {
    const target = await resolveTarget(userId, targetType, targetId);
    if (!target) return notFound();

    // random stored name, so two uploads with the same name never collide
    const rel = `${userId}/${randomUUID()}${ext}`;
    const full = safePath(rel);
    if (!full) return badRequest();

    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await file.arrayBuffer()));

    const resource = await prisma.resource.create({
      data: {
        userId,
        ...target,
        provider: "LOCAL",
        title: original,
        originalName: original,
        mimeType: mime,
        sizeBytes: file.size,
        storagePath: rel,
      },
      select: resourceSelect,
    });
    return Response.json({ ok: true, resource }, { status: 201 });
  } catch (e) {
    console.error("Upload failed:", e);
    return serverError();
  }
}