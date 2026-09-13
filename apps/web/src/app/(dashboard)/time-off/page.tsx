import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimeOffPanel } from "./time-off-panel";

export default async function TimeOffPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const manager = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const requests = await prisma.timeOffRequest.findMany({
    where: manager
      ? { organizationId: user.organizationId }
      : { userId: user.id },
    include: { user: true, reviewedBy: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <TimeOffPanel
      manager={manager}
      currentUserId={user.id}
      requests={requests.map((item) => ({
        id: item.id,
        userId: item.userId,
        userName: `${item.user.firstName} ${item.user.lastName}`.trim(),
        startsOn: item.startsOn.toISOString().slice(0, 10),
        endsOn: item.endsOn.toISOString().slice(0, 10),
        requestType: item.requestType,
        note: item.note,
        status: item.status,
        reviewer: item.reviewedBy
          ? `${item.reviewedBy.firstName} ${item.reviewedBy.lastName}`.trim()
          : null,
      }))}
    />
  );
}
