import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 42);
  const [shifts, openShifts, requests] = await Promise.all([
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        startsAt: { gte: start, lt: end },
        status: "PUBLISHED",
      },
      include: { location: true, position: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: null,
        startsAt: { gte: start, lt: end },
        status: "OPEN",
      },
      include: { location: true, position: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.timeOffRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const serializeShift = (shift: (typeof shifts)[number]) => ({
    id: shift.id,
    startsAt: shift.startsAt.toISOString(),
    endsAt: shift.endsAt.toISOString(),
    breakMinutes: shift.unpaidBreakMin,
    notes: shift.notes,
    location: shift.location.name,
    position: shift.position.name,
    color: shift.position.color,
  });
  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organization: user.organization.name,
    },
    shifts: shifts.map(serializeShift),
    openShifts: openShifts.map(serializeShift),
    requests: requests.map((item) => ({
      id: item.id,
      startsOn: item.startsOn.toISOString(),
      endsOn: item.endsOn.toISOString(),
      type: item.requestType,
      status: item.status,
      note: item.note,
    })),
  });
}
