import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";

const schema = z.object({ assigneeId: z.string().nullable(), startsAt: z.string().datetime(), endsAt: z.string().datetime() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getMobileUser(request);
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Ungültige Schichtdaten." }, { status: 400 });
  const id = (await params).id, startsAt = new Date(parsed.data.startsAt), endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt) return NextResponse.json({ error: "Das Ende muss nach dem Beginn liegen." }, { status: 400 });
  const shift = await prisma.shift.findFirst({ where: { id, organizationId: actor.organizationId } }); if (!shift) return NextResponse.json({ error: "Schicht nicht gefunden." }, { status: 404 });
  if (parsed.data.assigneeId) { const employee = await prisma.user.findFirst({ where: { id: parsed.data.assigneeId, organizationId: actor.organizationId, isActive: true } }); if (!employee) return NextResponse.json({ error: "Mitarbeiter nicht gefunden." }, { status: 404 }); const conflict = await assignmentConflict(employee.id, startsAt, endsAt, id); if (conflict) return NextResponse.json({ error: conflict }, { status: 409 }); }
  const updated = await prisma.shift.update({ where: { id }, data: { assigneeId: parsed.data.assigneeId, startsAt, endsAt, status: parsed.data.assigneeId ? "DRAFT" : "OPEN" } });
  return NextResponse.json({ shift: updated });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getMobileUser(request); if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const result = await prisma.shift.deleteMany({ where: { id: (await params).id, organizationId: actor.organizationId } }); if (!result.count) return NextResponse.json({ error: "Schicht nicht gefunden." }, { status: 404 }); return NextResponse.json({ deleted: true });
}
