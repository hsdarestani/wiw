import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShiftTradesPanel } from "./shift-trades-panel";

export default async function ShiftTradesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const manager = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const include = { location: true, position: true } as const;
  const [myShifts, openShifts, offers, trades] = await Promise.all([
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: "PUBLISHED",
        startsAt: { gt: new Date() },
      },
      include,
      orderBy: { startsAt: "asc" },
      take: 30,
    }),
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: null,
        status: "OPEN",
        startsAt: { gt: new Date() },
      },
      include,
      orderBy: { startsAt: "asc" },
      take: 30,
    }),
    prisma.shiftTrade.findMany({
      where: {
        organizationId: user.organizationId,
        kind: "SWAP",
        status: "OFFERED",
        ownerId: { not: user.id },
      },
      include: { shift: { include }, owner: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shiftTrade.findMany({
      where: manager
        ? { organizationId: user.organizationId, status: "PENDING" }
        : {
            organizationId: user.organizationId,
            OR: [{ ownerId: user.id }, { claimantId: user.id }],
          },
      include: {
        shift: { include },
        owner: true,
        claimant: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const shift = (item: (typeof myShifts)[number]) => ({
    id: item.id,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    position: item.position.name,
    color: item.position.color,
    location: item.location.name,
  });
  return (
    <ShiftTradesPanel
      manager={manager}
      myShifts={myShifts.map(shift)}
      openShifts={openShifts.map(shift)}
      offers={offers.map((item) => ({
        id: item.id,
        owner: item.owner
          ? `${item.owner.firstName} ${item.owner.lastName}`
          : "Teammitglied",
        shift: shift(item.shift),
      }))}
      trades={trades.map((item) => ({
        id: item.id,
        kind: item.kind,
        status: item.status,
        owner: item.owner
          ? `${item.owner.firstName} ${item.owner.lastName}`
          : null,
        claimant: item.claimant
          ? `${item.claimant.firstName} ${item.claimant.lastName}`
          : null,
        reviewer: item.reviewedBy
          ? `${item.reviewedBy.firstName} ${item.reviewedBy.lastName}`
          : null,
        shift: shift(item.shift),
      }))}
    />
  );
}
