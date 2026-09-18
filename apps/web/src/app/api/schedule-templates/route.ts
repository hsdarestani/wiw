import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name und Woche sind erforderlich." }, { status: 400 });
  const startsAt = new Date(parsed.data.startsAt), endsAt = new Date(parsed.data.endsAt);
  const shifts = await prisma.shift.findMany({ where: { organizationId: user.organizationId, startsAt: { gte: startsAt, lt: endsAt } } });
  if (!shifts.length) return NextResponse.json({ error: "Diese Woche enthält keine Schichten." }, { status: 400 });
  try {
    const template = await prisma.scheduleTemplate.create({
      data: {
        organizationId: user.organizationId,
        name: parsed.data.name,
        items: { create: shifts.map((shift) => {
          const dayStart = new Date(shift.startsAt); dayStart.setUTCHours(0, 0, 0, 0);
          return {
            weekdayOffset: Math.floor((dayStart.getTime() - startsAt.getTime()) / 86400000),
            startMinute: shift.startsAt.getUTCHours() * 60 + shift.startsAt.getUTCMinutes(),
            durationMinutes: Math.round((shift.endsAt.getTime() - shift.startsAt.getTime()) / 60000),
            unpaidBreakMin: shift.unpaidBreakMin,
            locationId: shift.locationId,
            positionId: shift.positionId,
            assigneeId: shift.assigneeId,
            notes: shift.notes,
          };
        }) },
      },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ein Template mit diesem Namen existiert bereits." }, { status: 409 });
  }
}
