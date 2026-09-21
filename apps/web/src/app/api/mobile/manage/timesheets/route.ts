import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const actor = await getMobileUser(request);
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 60);
  const entries = await prisma.timeEntry.findMany({
    where: { organizationId: actor.organizationId, clockIn: { gte: since }, clockOut: { not: null } },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { clockIn: "desc" },
    take: 500,
  });
  return NextResponse.json({ entries: entries.map((entry) => ({ id: entry.id, userId: entry.userId, employee: `${entry.user.firstName} ${entry.user.lastName}`.trim(), clockIn: entry.clockIn.toISOString(), clockOut: entry.clockOut!.toISOString(), breakMinutes: entry.breakMinutes, source: entry.source, approvalStatus: entry.approvalStatus, correctionNote: entry.correctionNote, correctionRequestedAt: entry.correctionRequestedAt?.toISOString() ?? null, reviewedAt: entry.reviewedAt?.toISOString() ?? null })) });
}
