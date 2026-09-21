import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.union([z.string().email(), z.literal("")]).optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
  locationId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe die Einladung." },
      { status: 400 },
    );
  if (user.role === "MANAGER" && parsed.data.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Manager können nur Mitarbeiter einladen." }, { status: 403 });
  if (parsed.data.locationId) {
    const location = await prisma.location.findFirst({
      where: {
        id: parsed.data.locationId,
        organizationId: user.organizationId,
      },
      select: { id: true },
    });
    if (!location)
      return NextResponse.json(
        { error: "Standort nicht gefunden." },
        { status: 404 },
      );
  }
  const code = randomBytes(5).toString("hex").toUpperCase();
  const invitation = await prisma.invitation.create({
    data: {
      code,
      email: parsed.data.email?.trim().toLowerCase() || null,
      role: parsed.data.role,
      locationId: parsed.data.locationId || null,
      organizationId: user.organizationId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });
  return NextResponse.json(
    { invitation: { code: invitation.code, expiresAt: invitation.expiresAt } },
    { status: 201 },
  );
}
