import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Ungültiger Zeitraum." },
      { status: 400 },
    );
  const sourceStart = new Date(parsed.data.startsAt),
    sourceEnd = new Date(parsed.data.endsAt);
  const targetStart = new Date(sourceStart);
  targetStart.setUTCDate(targetStart.getUTCDate() + 7);
  const targetEnd = new Date(sourceEnd);
  targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);
  const existing = await prisma.shift.count({
    where: {
      organizationId: user.organizationId,
      startsAt: { gte: targetStart, lt: targetEnd },
    },
  });
  if (existing)
    return NextResponse.json(
      { error: "Die Zielwoche enthält bereits Schichten." },
      { status: 409 },
    );
  const source = await prisma.shift.findMany({
    where: {
      organizationId: user.organizationId,
      startsAt: { gte: sourceStart, lt: sourceEnd },
    },
  });
  await prisma.shift.createMany({
    data: source.map((shift) => ({
      organizationId: shift.organizationId,
      locationId: shift.locationId,
      positionId: shift.positionId,
      assigneeId: shift.assigneeId,
      startsAt: new Date(shift.startsAt.getTime() + 7 * 86400000),
      endsAt: new Date(shift.endsAt.getTime() + 7 * 86400000),
      unpaidBreakMin: shift.unpaidBreakMin,
      notes: shift.notes,
      status: shift.assigneeId ? "DRAFT" : "OPEN",
    })),
  });
  return NextResponse.json({ copied: source.length });
}
