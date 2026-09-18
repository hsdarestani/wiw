import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";

const applySchema = z.object({ targetMonday: z.string().datetime() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = applySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Zielwoche." }, { status: 400 });
  const targetStart = new Date(parsed.data.targetMonday), targetEnd = new Date(parsed.data.targetMonday); targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);
  if (await prisma.shift.count({ where: { organizationId: user.organizationId, startsAt: { gte: targetStart, lt: targetEnd } } }))
    return NextResponse.json({ error: "Die Zielwoche enthält bereits Schichten." }, { status: 409 });
  const template = await prisma.scheduleTemplate.findFirst({ where: { id: (await params).id, organizationId: user.organizationId }, include: { items: true } });
  if (!template) return NextResponse.json({ error: "Template nicht gefunden." }, { status: 404 });
  const refs = await Promise.all([
    prisma.location.findMany({ where: { organizationId: user.organizationId }, select: { id: true } }),
    prisma.position.findMany({ where: { organizationId: user.organizationId }, select: { id: true } }),
    prisma.user.findMany({ where: { organizationId: user.organizationId, isActive: true }, select: { id: true } }),
  ]);
  const locations = new Set(refs[0].map((x) => x.id)), positions = new Set(refs[1].map((x) => x.id)), users = new Set(refs[2].map((x) => x.id));
  if (template.items.some((x) => !locations.has(x.locationId) || !positions.has(x.positionId) || (x.assigneeId && !users.has(x.assigneeId))))
    return NextResponse.json({ error: "Das Template verweist auf entfernte Mitarbeiter, Positionen oder Standorte." }, { status: 409 });
  const shifts = template.items.map((item) => {
    const startsAt = new Date(targetStart); startsAt.setUTCDate(startsAt.getUTCDate() + item.weekdayOffset); startsAt.setUTCMinutes(item.startMinute);
    return { organizationId: user.organizationId, locationId: item.locationId, positionId: item.positionId, assigneeId: item.assigneeId, startsAt, endsAt: new Date(startsAt.getTime() + item.durationMinutes * 60000), unpaidBreakMin: item.unpaidBreakMin, notes: item.notes, status: item.assigneeId ? "DRAFT" as const : "OPEN" as const };
  });
  for (const shift of shifts) if (shift.assigneeId) { const conflict = await assignmentConflict(shift.assigneeId, shift.startsAt, shift.endsAt); if (conflict) return NextResponse.json({ error: conflict }, { status: 409 }); }
  await prisma.shift.createMany({ data: shifts });
  return NextResponse.json({ applied: shifts.length });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const template = await prisma.scheduleTemplate.findFirst({ where: { id: (await params).id, organizationId: user.organizationId } });
  if (!template) return NextResponse.json({ error: "Template nicht gefunden." }, { status: 404 });
  await prisma.scheduleTemplate.delete({ where: { id: template.id } });
  return NextResponse.json({ deleted: true });
}
