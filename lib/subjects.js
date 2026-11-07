import { prisma } from "@/lib/db";

// typed subject name -> subject id. creates the subject if it's new.
// blank name = no subject (null)
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
