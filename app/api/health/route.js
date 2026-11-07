import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic"; // don't cache, always check live

// GET /api/health: quick check if the API can reach the db
// open localhost:3000/api/health, { ok: true } = connected
export async function GET() {
  try {
    const users = await prisma.user.count();
    return Response.json({ ok: true, database: "connected", users });
  } catch (e) {
    console.error("Health check failed:", e);
    return Response.json(
      {
        ok: false,
        database: "not reachable",
        message: "Check DATABASE_URL in .env and that MySQL is running.",
      },
      { status: 500 }
    );
  }
}
