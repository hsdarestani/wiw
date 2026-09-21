import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";
import { sendPush } from "@/lib/push";
const schema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  const drafts = await prisma.shift.findMany({ where: { organizationId: user.organizationId, status: "DRAFT", startsAt: { gte: new Date(parsed.data.startsAt), lt: new Date(parsed.data.endsAt) }, assigneeId: { not: null } }, select: { id: true, assigneeId: true, startsAt: true, endsAt: true } });
  const assignees = [...new Set(drafts.flatMap((shift) => shift.assigneeId ? [shift.assigneeId] : []))];
  for (const shift of drafts) {
    if (!shift.assigneeId) continue;
    const conflict = await assignmentConflict(shift.assigneeId, shift.startsAt, shift.endsAt, shift.id);
    if (conflict) return NextResponse.json({ error: `Dienstplan kann nicht veröffentlicht werden: ${conflict}` }, { status: 409 });
  }
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.shift.updateMany({ where: { organizationId: user.organizationId, status: "DRAFT", startsAt: { gte: new Date(parsed.data.startsAt), lt: new Date(parsed.data.endsAt) } }, data: { status: "PUBLISHED" } });
    if (assignees.length) await tx.notification.createMany({ data: assignees.map((userId) => ({ organizationId: user.organizationId, userId, type: "SCHEDULE", title: "Dienstplan veröffentlicht", body: "Dein Dienstplan wurde aktualisiert.", href: "/schedule" })) });
    return updated;
  });
  await sendPush(assignees, "Dienstplan veröffentlicht", "Dein Dienstplan wurde aktualisiert.", { type: "SCHEDULE", href: "/schedule" });
  return NextResponse.json({ published: result.count });
}
