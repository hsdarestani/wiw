import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ note: z.string().trim().min(3).max(500) });
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getMobileUser(request);
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte beschreibe die Korrektur." },
      { status: 400 },
    );
  const { id } = await params;
  const entry = await prisma.timeEntry.findFirst({
    where: {
      id,
      userId: user.id,
      organizationId: user.organizationId,
      clockOut: { not: null },
    },
  });
  if (!entry)
    return NextResponse.json(
      { error: "Zeiteintrag nicht gefunden." },
      { status: 404 },
    );
  await prisma.$transaction(async (tx) => {
    await tx.timeEntry.update({
      where: { id },
      data: {
        correctionNote: parsed.data.note,
        correctionRequestedAt: new Date(),
        approvalStatus: "PENDING",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        entityType: "TimeEntry",
        entityId: id,
        action: "REQUEST_CORRECTION",
        reason: parsed.data.note,
        before: { approvalStatus: entry.approvalStatus },
        after: { approvalStatus: "PENDING", correctionNote: parsed.data.note },
      },
    });
  });
  return NextResponse.json({ ok: true });
}
