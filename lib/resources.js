import path from "node:path";
import { prisma } from "@/lib/db";

// uploaded files live here (outside /public, so only our login-checked route can serve them)
export const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// allowed file types. we decide the mime type from the extension, never from the browser
export const ALLOWED_TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
};

// fields the browser is allowed to see (never storagePath)
export const resourceSelect = {
  id: true,
  provider: true,
  title: true,
  url: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
};

// turns a stored relative path into a full path, and refuses anything outside STORAGE_ROOT
export function safePath(relPath) {
  const full = path.resolve(STORAGE_ROOT, relPath);
  return full.startsWith(STORAGE_ROOT + path.sep) ? full : null;
}

export function cleanFileName(name) {
  return (name || "file").replace(/[^\w.\- ()]/g, "_").slice(0, 150);
}

// accepts only Google Drive / Docs links. returns null for anything else
export function parseDriveLink(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname !== "drive.google.com" && url.hostname !== "docs.google.com") return null;

  const match = url.pathname.match(/\/(?:d|folders)\/([\w-]+)/);
  const externalId = match?.[1] ?? url.searchParams.get("id") ?? null;

  let label = "Google Drive file";
  if (url.hostname === "docs.google.com") {
    if (url.pathname.startsWith("/document")) label = "Google Doc";
    else if (url.pathname.startsWith("/spreadsheets")) label = "Google Sheet";
    else if (url.pathname.startsWith("/presentation")) label = "Google Slides";
    else if (url.pathname.startsWith("/forms")) label = "Google Form";
  } else if (url.pathname.includes("/folders/")) {
    label = "Google Drive folder";
  }

  return { url: url.toString(), externalId, label };
}

// which task/event is this attached to? it must belong to the user
export async function resolveTarget(userId, type, id) {
  if (type === "task") {
    const t = await prisma.task.findFirst({
      where: { id, userId },
      select: { id: true, subjectId: true },
    });
    return t ? { taskId: t.id, eventId: null, subjectId: t.subjectId } : null;
  }
  if (type === "event") {
    const e = await prisma.event.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, subjectId: true },
    });
    return e ? { taskId: null, eventId: e.id, subjectId: e.subjectId } : null;
  }
  return null;
}