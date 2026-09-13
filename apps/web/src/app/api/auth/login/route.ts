import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe deine Eingaben." },
      { status: 400 },
    );
  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(parsed.data.password, user.passwordHash)))
    return NextResponse.json(
      { error: "E-Mail-Adresse oder Passwort ist falsch." },
      { status: 401 },
    );
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
