// TEMPORARY: delete after confirming the database connection works.
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.count();
    return Response.json({ ok: true, users });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}