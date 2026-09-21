import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";
const schema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });
export async function POST(request: Request) {
  const actor = await getMobileUser(request); if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  const sourceStart = new Date(parsed.data.startsAt), sourceEnd = new Date(parsed.data.endsAt), targetStart = new Date(sourceStart), targetEnd = new Date(sourceEnd); targetStart.setUTCDate(targetStart.getUTCDate() + 7); targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);
  if (await prisma.shift.count({ where: { organizationId: actor.organizationId, startsAt: { gte: targetStart, lt: targetEnd } } })) return NextResponse.json({ error: "Die nächste Woche enthält bereits Schichten." }, { status: 409 });
  const source = await prisma.shift.findMany({ where: { organizationId: actor.organizationId, startsAt: { gte: sourceStart, lt: sourceEnd } } });
  const target = source.map((shift) => ({ organizationId: shift.organizationId, locationId: shift.locationId, positionId: shift.positionId, assigneeId: shift.assigneeId, startsAt: new Date(shift.startsAt.getTime() + 7 * 86400000), endsAt: new Date(shift.endsAt.getTime() + 7 * 86400000), unpaidBreakMin: shift.unpaidBreakMin, notes: shift.notes, status: shift.assigneeId ? "DRAFT" as const : "OPEN" as const, taskListId: shift.taskListId }));
  for (const shift of target) if (shift.assigneeId) { const conflict = await assignmentConflict(shift.assigneeId, shift.startsAt, shift.endsAt); if (conflict) return NextResponse.json({ error: `Woche kann nicht kopiert werden: ${conflict}` }, { status: 409 }); }
  await prisma.shift.createMany({ data: target }); return NextResponse.json({ copied: target.length });
}
