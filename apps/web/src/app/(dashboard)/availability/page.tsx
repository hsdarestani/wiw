import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityPanel } from "./availability-panel";

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const manager = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const rules = await prisma.availabilityRule.findMany({
    where: manager
      ? { organizationId: user.organizationId }
      : { userId: user.id },
    include: { user: true },
    orderBy: [
      { user: { firstName: "asc" } },
      { weekday: "asc" },
      { startMinute: "asc" },
    ],
  });
  return (
    <AvailabilityPanel
      currentUserId={user.id}
      manager={manager}
      rules={rules.map((rule) => ({
        id: rule.id,
        userId: rule.userId,
        userName: `${rule.user.firstName} ${rule.user.lastName}`.trim(),
        weekday: rule.weekday,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        available: rule.available,
      }))}
    />
  );
}
