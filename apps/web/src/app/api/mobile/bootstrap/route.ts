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
  const [
    shifts,
    openShifts,
    requests,
    trades,
    swapOffers,
    timeEntries,
    availability,
    conversations,
    directory,
    notifications,
    management,
    geofenceCount,
  ] = await Promise.all([
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        startsAt: { gte: start, lt: end },
        status: "PUBLISHED",
      },
      include: { location: true, position: true, taskList: { include: { items: { orderBy: { sortOrder: "asc" }, include: { completions: true } } } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.shift.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: null,
        startsAt: { gte: start, lt: end },
        status: "OPEN",
      },
      include: { location: true, position: true, taskList: { include: { items: { orderBy: { sortOrder: "asc" }, include: { completions: true } } } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.timeOffRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.shiftTrade.findMany({
      where: {
        organizationId: user.organizationId,
        ...(new Set(["OWNER", "ADMIN", "MANAGER"]).has(user.role)
          ? { status: "PENDING" }
          : { OR: [{ ownerId: user.id }, { claimantId: user.id }] }),
      },
      include: {
        shift: { include: { location: true, position: true, taskList: { include: { items: { orderBy: { sortOrder: "asc" }, include: { completions: true } } } } } },
        owner: true,
        claimant: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.shiftTrade.findMany({
      where: {
        organizationId: user.organizationId,
        kind: "SWAP",
        status: "OFFERED",
        ownerId: { not: user.id },
      },
      include: {
        shift: { include: { location: true, position: true, taskList: { include: { items: { orderBy: { sortOrder: "asc" }, include: { completions: true } } } } } },
        owner: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { userId: user.id, clockIn: { gte: start } },
      orderBy: { clockIn: "desc" },
      take: 100,
    }),
    prisma.availabilityRule.findMany({
      where: { userId: user.id },
      orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
    }),
    prisma.conversation.findMany({ where: { organizationId: user.organizationId, participants: { some: { userId: user.id } } }, include: { participants: { include: { user: true } }, messages: { include: { author: true }, orderBy: { createdAt: "asc" }, take: 200 } }, orderBy: { updatedAt: "desc" } }),
    prisma.user.findMany({ where: { organizationId: user.organizationId, isActive: true, id: { not: user.id } }, select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
    new Set(["OWNER", "ADMIN", "MANAGER"]).has(user.role)
      ? Promise.all([
          prisma.user.findMany({ where: { organizationId: user.organizationId }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
          prisma.location.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
          prisma.position.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
          prisma.taskList.findMany({ where: { organizationId: user.organizationId }, include: { _count: { select: { items: true } } }, orderBy: { name: "asc" } }),
        ])
      : Promise.resolve(null),
    prisma.location.count({ where: { organizationId: user.organizationId, latitude: { not: null }, longitude: { not: null } } }),
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
    taskList: shift.taskList ? { id: shift.taskList.id, name: shift.taskList.name, items: shift.taskList.items.map((item) => ({ id: item.id, title: item.title, completed: item.completions.some((completion) => completion.shiftId === shift.id) })) } : null,
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
    trades: trades.map((item) => ({
      id: item.id,
      kind: item.kind,
      status: item.status,
      owner: item.owner
        ? `${item.owner.firstName} ${item.owner.lastName}`
        : null,
      claimant: item.claimant
        ? `${item.claimant.firstName} ${item.claimant.lastName}`
        : null,
      shift: serializeShift(item.shift),
    })),
    swapOffers: swapOffers.map((item) => ({
      id: item.id,
      owner: item.owner
        ? `${item.owner.firstName} ${item.owner.lastName}`
        : null,
      shift: serializeShift(item.shift),
    })),
    timeEntries: timeEntries.map((item) => ({
      id: item.id,
      clockIn: item.clockIn.toISOString(),
      clockOut: item.clockOut?.toISOString() ?? null,
      source: item.source,
      breakStartedAt: item.breakStartedAt?.toISOString() ?? null,
      breakMinutes: item.breakMinutes,
      approvalStatus: item.approvalStatus,
      correctionNote: item.correctionNote,
    })),
    availability: availability.map((item) => ({
      id: item.id,
      weekday: item.weekday,
      startMinute: item.startMinute,
      endMinute: item.endMinute,
      available: item.available,
    })),
    notifications: notifications.map((item) => ({ id: item.id, type: item.type, title: item.title, body: item.body, href: item.href, readAt: item.readAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() })),
    conversations: conversations.map((conversation) => { const mine = conversation.participants.find((item) => item.userId === user.id), others = conversation.participants.filter((item) => item.userId !== user.id); return { id: conversation.id, title: conversation.isGroup ? conversation.name || "Gruppe" : others.map((item) => `${item.user.firstName} ${item.user.lastName}`.trim()).join(", ") || "Nur du", isGroup: conversation.isGroup, unread: conversation.messages.filter((message) => message.authorId !== user.id && (!mine?.lastReadAt || message.createdAt > mine.lastReadAt)).length, messages: conversation.messages.map((message) => ({ id: message.id, content: message.content, createdAt: message.createdAt.toISOString(), authorId: message.authorId, authorName: `${message.author.firstName} ${message.author.lastName}`.trim(), readCount: conversation.participants.filter((participant) => participant.userId !== message.authorId && participant.lastReadAt && participant.lastReadAt >= message.createdAt).length, recipientCount: conversation.participants.length - 1 })) }; }),
    directory: directory.map((item) => ({ id: item.id, name: `${item.firstName} ${item.lastName}`.trim() })),
    management: management
      ? {
          employees: management[0].map((item) => ({ id: item.id, name: `${item.firstName} ${item.lastName}`.trim(), email: item.email, role: item.role, hourlyRate: Number(item.hourlyRate), isActive: item.isActive })),
          locations: management[1].map((item) => ({ id: item.id, name: item.name })),
          positions: management[2].map((item) => ({ id: item.id, name: item.name, color: item.color })),
          taskLists: management[3].map((item) => ({ id: item.id, name: item.name, itemCount: item._count.items })),
        }
      : null,
    clockPolicy: { locationRequired: geofenceCount > 0 },
  });
}
