import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { safePath } from "@/lib/resources";
import { getUserId, unauthorized, notFound } from "@/lib/apiHelpers";

export const runtime = "nodejs";

// GET /api/resources/:id/file: only the owner can open their uploaded file
export async function GET(request, { params }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await params;

  try {
    const resource = await prisma.resource.findFirst({
      where: { id, userId, provider: "LOCAL" },
    });
    if (!resource?.storagePath) return notFound();

    const full = safePath(resource.storagePath);
    if (!full) return notFound();

    const data = await readFile(full);
    const mime = resource.mimeType || "application/octet-stream";
    // PDFs and images open in the browser, everything else downloads
    const inline = mime === "application/pdf" || mime.startsWith("image/");
    const name = encodeURIComponent(resource.originalName || "file");

    return new Response(data, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(data.length),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${name}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound(); // file missing on disk
  }
}