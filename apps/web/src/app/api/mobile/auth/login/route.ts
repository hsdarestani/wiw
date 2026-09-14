import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createMobileSession } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bitte prüfe deine Eingaben." },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.trim().toLowerCase() },
    include: { organization: true },
  });
  if (!user || !user.isActive || !(await compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "E-Mail-Adresse oder Passwort ist falsch." },
      { status: 401 },
    );
  }
  const session = await createMobileSession(user.id);
  return NextResponse.json({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organization: user.organization.name,
    },
  });
}
