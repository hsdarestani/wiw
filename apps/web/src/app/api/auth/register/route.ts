import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  company: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  industry: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte fülle alle Pflichtfelder korrekt aus." },
      { status: 400 },
    );
  const email = parsed.data.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } }))
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 },
    );
  const [firstName, ...rest] = parsed.data.name.split(/\s+/);
  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: parsed.data.company,
        industry: parsed.data.industry || null,
      },
    });
    await tx.location.create({
      data: { name: parsed.data.location, organizationId: organization.id },
    });
    await tx.position.createMany({
      data: [
        { name: "Service", color: "#2e8dbf", organizationId: organization.id },
        { name: "Küche", color: "#e58a2d", organizationId: organization.id },
        { name: "Teamleitung", color: "#8068bd", organizationId: organization.id },
        { name: "Verkauf", color: "#3a9d71", organizationId: organization.id },
      ],
    });
    return tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName: rest.join(" ") || "",
        organizationId: organization.id,
        role: "OWNER",
      },
    });
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
