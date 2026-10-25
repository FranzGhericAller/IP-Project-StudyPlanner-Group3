import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema, toFieldErrors } from "@/lib/validators/authSchema";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: toFieldErrors(parsed.error) }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json(
      { errors: { email: "An account with this email already exists." } },
      { status: 409 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash } });
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    // P2002 = unique constraint (two people registering the same email at once)
    if (e?.code === "P2002") {
      return Response.json(
        { errors: { email: "An account with this email already exists." } },
        { status: 409 }
      );
    }
    console.error("Register failed:", e);
    return Response.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}