import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkplaceSettings } from "./workplace-settings";

export default async function WorkplacesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) redirect("/schedule");
  const [locations, positions] = await Promise.all([
    prisma.location.findMany({
      where: { organizationId: user.organizationId },
      include: { _count: { select: { shifts: true, invitations: true, timeEntries: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.position.findMany({
      where: { organizationId: user.organizationId },
      include: { _count: { select: { shifts: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <WorkplaceSettings
      locations={locations.map((item) => ({ id: item.id, name: item.name, usage: item._count.shifts + item._count.invitations + item._count.timeEntries, latitude: item.latitude, longitude: item.longitude, geofenceRadius: item.geofenceRadius }))}
      positions={positions.map((item) => ({ id: item.id, name: item.name, color: item.color, usage: item._count.shifts }))}
    />
  );
}
