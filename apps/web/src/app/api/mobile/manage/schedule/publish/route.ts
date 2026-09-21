import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";
import { sendPush } from "@/lib/push";
const schema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });
export async function POST(request: Request) {
  const actor = await getMobileUser(request); if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  const from = new Date(parsed.data.startsAt), to = new Date(parsed.data.endsAt);
  const drafts = await prisma.shift.findMany({ where: { organizationId: actor.organizationId, status: "DRAFT", startsAt: { gte: from, lt: to }, assigneeId: { not: null } }, select: { id: true, assigneeId: true, startsAt: true, endsAt: true } });
  for (const shift of drafts) if (shift.assigneeId) { const conflict = await assignmentConflict(shift.assigneeId, shift.startsAt, shift.endsAt, shift.id); if (conflict) return NextResponse.json({ error: `Veröffentlichung nicht möglich: ${conflict}` }, { status: 409 }); }
  const users = [...new Set(drafts.flatMap((shift) => shift.assigneeId ? [shift.assigneeId] : []))];
  const result = await prisma.$transaction(async (tx) => { const updated = await tx.shift.updateMany({ where: { id: { in: drafts.map((item) => item.id) } }, data: { status: "PUBLISHED" } }); if (users.length) await tx.notification.createMany({ data: users.map((userId) => ({ organizationId: actor.organizationId, userId, type: "SCHEDULE", title: "Dienstplan veröffentlicht", body: "Dein Dienstplan wurde aktualisiert.", href: "/schedule" })) }); return updated; });
  await sendPush(users, "Dienstplan veröffentlicht", "Dein Dienstplan wurde aktualisiert.", { type: "SCHEDULE", href: "/schedule" }); return NextResponse.json({ published: result.count });
}
