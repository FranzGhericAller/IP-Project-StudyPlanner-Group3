import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { readJson, badRequest, validationError, serverError } from "@/lib/apiHelpers";

const emailTaken = () =>
  Response.json(
    { errors: { email: "An account with this email already exists." } },
    { status: 409 }
  );

// POST /api/register: create an account (no login needed)
export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return emailTaken();

  try {
    // we only save the bcrypt hash, never the actual pw
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash } });
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    // P2002 = unique email rule hit (2 ppl signing up w/ the same email at the same time)
    if (e?.code === "P2002") return emailTaken();
    console.error("Register failed:", e);
    return serverError();
  }
}
