import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

const schema = z.object({ status: z.enum(["APPROVED", "DECLINED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getMobileUser(request);
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  const id = (await params).id;
  const entry = await prisma.timeEntry.findFirst({ where: { id, organizationId: actor.organizationId, clockOut: { not: null } } });
  if (!entry) return NextResponse.json({ error: "Zeiteintrag nicht gefunden." }, { status: 404 });
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.timeEntry.update({ where: { id }, data: { approvalStatus: parsed.data.status, reviewedById: actor.id, reviewedAt: new Date(), correctionNote: null, correctionRequestedAt: null } });
    const approved = parsed.data.status === "APPROVED";
    await tx.notification.create({ data: { organizationId: actor.organizationId, userId: entry.userId, type: "TIMESHEET", title: approved ? "Arbeitszeit genehmigt" : "Arbeitszeit abgelehnt", body: approved ? "Dein Zeiteintrag wurde genehmigt." : "Dein Zeiteintrag wurde abgelehnt. Bitte prüfe die Angaben.", href: "/time-clock" } });
    await tx.auditLog.create({ data: { organizationId: actor.organizationId, actorId: actor.id, entityType: "TimeEntry", entityId: id, action: "REVIEW", reason: parsed.data.status, before: { approvalStatus: entry.approvalStatus }, after: { approvalStatus: next.approvalStatus } } });
    return next;
  });
  const approved = parsed.data.status === "APPROVED";
  await sendPush([entry.userId], approved ? "Arbeitszeit genehmigt" : "Arbeitszeit abgelehnt", approved ? "Dein Zeiteintrag wurde genehmigt." : "Bitte prüfe die Angaben deines Zeiteintrags.", { type: "TIMESHEET", href: "/time-clock" });
  return NextResponse.json({ entry: { id: updated.id, approvalStatus: updated.approvalStatus } });
}
