import { unlink } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { safePath } from "@/lib/resources";
import { getUserId, unauthorized, notFound, serverError } from "@/lib/apiHelpers";

export const runtime = "nodejs";

// DELETE /api/resources/:id
export async function DELETE(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const resource = await prisma.resource.findFirst({ where: { id, userId } });
    if (!resource) return notFound();

    await prisma.resource.deleteMany({ where: { id, userId } });

    // uploaded file -> remove it from disk too
    if (resource.provider === "LOCAL" && resource.storagePath) {
      const full = safePath(resource.storagePath);
      if (full) await unlink(full).catch(() => {});
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Delete resource failed:", e);
    return serverError();
  }
}