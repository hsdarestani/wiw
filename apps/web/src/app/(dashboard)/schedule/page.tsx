import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScheduleBoard } from "./schedule-board";

function mondayFor(value?: string) {
  const date =
    value && !Number.isNaN(Date.parse(value))
      ? new Date(`${value}T00:00:00Z`)
      : new Date();
  date.setUTCHours(0, 0, 0, 0);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const monday = mondayFor((await searchParams).week);
  const end = new Date(monday);
  end.setUTCDate(end.getUTCDate() + 7);
  let positions = await prisma.position.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
  if (!positions.length) {
    await prisma.position.create({
      data: { name: "Allgemein", organizationId: user.organizationId },
    });
    positions = await prisma.position.findMany({
      where: { organizationId: user.organizationId },
    });
  }
  const [members, locations, shifts] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.location.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        startsAt: { gte: monday, lt: end },
      },
      include: { position: true, location: true, assignee: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);
  return (
    <ScheduleBoard
      monday={monday.toISOString()}
      members={members.map((x) => ({
        id: x.id,
        name: `${x.firstName} ${x.lastName}`.trim(),
        hourlyRate: Number(x.hourlyRate),
      }))}
      locations={locations.map((x) => ({ id: x.id, name: x.name }))}
      positions={positions.map((x) => ({ id: x.id, name: x.name, color: x.color }))}
      shifts={shifts.map((x) => ({
        id: x.id,
        assigneeId: x.assigneeId,
        startsAt: x.startsAt.toISOString(),
        endsAt: x.endsAt.toISOString(),
        unpaidBreakMin: x.unpaidBreakMin,
        status: x.status,
        position: { name: x.position.name, color: x.position.color },
        location: { name: x.location.name },
      }))}
    />
  );
}
