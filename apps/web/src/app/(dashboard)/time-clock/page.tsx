import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimeClockPanel } from "./time-clock-panel";

export default async function TimeClockPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const manager = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const [entries, activeTeam] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId: user.id, clockIn: { gte: since } },
      include: { location: true },
      orderBy: { clockIn: "desc" },
      take: 100,
    }),
    manager
      ? prisma.timeEntry.findMany({
          where: { organizationId: user.organizationId, clockOut: null },
          include: { user: true, location: true },
          orderBy: { clockIn: "asc" },
        })
      : [],
  ]);
  return (
    <TimeClockPanel
      entries={entries.map((item) => ({
        id: item.id,
        clockIn: item.clockIn.toISOString(),
        clockOut: item.clockOut?.toISOString() ?? null,
        source: item.source,
        location: item.location?.name ?? null,
      }))}
      activeTeam={activeTeam.map((item) => ({
        id: item.id,
        name: `${item.user.firstName} ${item.user.lastName}`,
        clockIn: item.clockIn.toISOString(),
        location: item.location?.name ?? null,
      }))}
    />
  );
}
