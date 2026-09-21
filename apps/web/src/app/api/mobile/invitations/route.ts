import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.union([z.string().email(), z.literal("")]), role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]) });

export async function POST(request: Request) {
  const actor = await getMobileUser(request);
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Einladung prüfen." }, { status: 400 });
  if (actor.role === "MANAGER" && parsed.data.role !== "EMPLOYEE") return NextResponse.json({ error: "Manager können nur Mitarbeiter einladen." }, { status: 403 });
  const invitation = await prisma.invitation.create({ data: { code: randomBytes(5).toString("hex").toUpperCase(), email: parsed.data.email.trim().toLowerCase() || null, role: parsed.data.role, organizationId: actor.organizationId, expiresAt: new Date(Date.now() + 7 * 86_400_000) } });
  return NextResponse.json({ invitation: { code: invitation.code, expiresAt: invitation.expiresAt.toISOString() } }, { status: 201 });
}
