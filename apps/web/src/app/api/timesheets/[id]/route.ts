import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("REVIEW"),
    status: z.enum(["APPROVED", "DECLINED"]),
  }),
  z.object({
    action: z.literal("EDIT"),
    clockIn: z.string().datetime(),
    clockOut: z.string().datetime(),
    breakMinutes: z.number().int().min(0).max(1440),
    reason: z.string().trim().min(3).max(500),
  }),
]);
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe die Angaben." },
      { status: 400 },
    );
  const { id } = await params;
  const entry = await prisma.timeEntry.findFirst({
    where: { id, organizationId: user.organizationId, clockOut: { not: null } },
  });
  if (!entry)
    return NextResponse.json(
      { error: "Zeiteintrag nicht gefunden." },
      { status: 404 },
    );
  if (parsed.data.action === "REVIEW") {
    const data = parsed.data;
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.timeEntry.update({
        where: { id },
        data: {
          approvalStatus: data.status,
          reviewedById: user.id,
          reviewedAt: new Date(),
          correctionNote: null,
          correctionRequestedAt: null,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          entityType: "TimeEntry",
          entityId: id,
          action: "REVIEW",
          reason: data.status,
          before: { approvalStatus: entry.approvalStatus },
          after: { approvalStatus: next.approvalStatus },
        },
      });
      return next;
    });
    return NextResponse.json({ entry: updated });
  }
  const data = parsed.data;
  const clockIn = new Date(data.clockIn),
    clockOut = new Date(data.clockOut);
  if (clockOut <= clockIn)
    return NextResponse.json(
      { error: "Das Ende muss nach dem Beginn liegen." },
      { status: 400 },
    );
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.timeEntry.update({
      where: { id },
      data: {
        clockIn,
        clockOut,
        breakMinutes: data.breakMinutes,
        approvalStatus: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        correctionNote: null,
        correctionRequestedAt: null,
        source: "MANUAL",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        entityType: "TimeEntry",
        entityId: id,
        action: "EDIT",
        reason: data.reason,
        before: {
          clockIn: entry.clockIn.toISOString(),
          clockOut: entry.clockOut?.toISOString(),
          breakMinutes: entry.breakMinutes,
        },
        after: {
          clockIn: next.clockIn.toISOString(),
          clockOut: next.clockOut?.toISOString(),
          breakMinutes: next.breakMinutes,
        },
      },
    });
    return next;
  });
  return NextResponse.json({ entry: updated });
}
