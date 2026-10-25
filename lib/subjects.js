import { prisma } from "@/lib/db";

// Turns a typed subject name into a Subject row id.
// Reuses the row if it exists, creates it if not. Empty name -> null (no subject).
export async function getSubjectId(userId, name) {
  const clean = name?.trim();
  if (!clean) return null;

  const subject = await prisma.subject.upsert({
    where: { userId_name: { userId, name: clean } },
    update: {},
    create: { userId, name: clean },
  });
  return subject.id;
}