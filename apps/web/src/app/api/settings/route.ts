import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("PROFILE"), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().max(80), hourlyRate: z.coerce.number().min(0).max(100000) }),
  z.object({ action: z.literal("ORGANIZATION"), name: z.string().trim().min(2).max(120), industry: z.string().trim().max(80) }),
  z.object({ action: z.literal("TIME_CLOCK"), clockRoundingMinutes: z.coerce.number().int().refine((value) => [0, 5, 10, 15].includes(value)), clockGraceMinutes: z.coerce.number().int().min(0).max(15), autoBreakAfterMinutes: z.coerce.number().int().min(0).max(1440), autoBreakMinutes: z.coerce.number().int().min(0).max(240) }),
]);
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte prüfe deine Angaben." }, { status: 400 });
  if (parsed.data.action === "TIME_CLOCK") {
    if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
    const data = parsed.data;
    await prisma.organization.update({ where: { id: user.organizationId }, data: { clockRoundingMinutes: data.clockRoundingMinutes, clockGraceMinutes: data.clockGraceMinutes, autoBreakAfterMinutes: data.autoBreakAfterMinutes || null, autoBreakMinutes: data.autoBreakAfterMinutes ? data.autoBreakMinutes : 0 } });
  } else if (parsed.data.action === "ORGANIZATION") {
    if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
    const data = parsed.data;
    await prisma.$transaction(async (tx) => {
      const updated = await tx.organization.update({ where: { id: user.organizationId }, data: { name: data.name, industry: data.industry || null } });
      await tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, entityType: "Organization", entityId: user.organizationId, action: "UPDATE", reason: "Unternehmenseinstellungen geändert", before: { name: user.organization.name, industry: user.organization.industry }, after: { name: updated.name, industry: updated.industry } } });
    });
  } else {
    const data = parsed.data;
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: user.id }, data: { firstName: data.firstName, lastName: data.lastName, hourlyRate: data.hourlyRate } });
      await tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, entityType: "User", entityId: user.id, action: "UPDATE_PROFILE", reason: "Profileinstellungen geändert", before: { firstName: user.firstName, lastName: user.lastName, hourlyRate: String(user.hourlyRate) }, after: { firstName: updated.firstName, lastName: updated.lastName, hourlyRate: String(updated.hourlyRate) } } });
    });
  }
  return NextResponse.json({ ok: true });
}
