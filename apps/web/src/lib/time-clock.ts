import { Prisma, TimeEntrySource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ClockUser = { id: string; organizationId: string };

export async function clockIn(user: ClockUser, source: TimeEntrySource) {
  const existing = await prisma.timeEntry.findFirst({
    where: { userId: user.id, clockOut: null },
  });
  if (existing)
    return { error: "Du bist bereits eingestempelt.", status: 409 } as const;
  try {
    const entry = await prisma.timeEntry.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        clockIn: new Date(),
        source,
      },
    });
    return { entry } as const;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { error: "Du bist bereits eingestempelt.", status: 409 } as const;
    throw error;
  }
}

export async function clockOut(user: ClockUser) {
  const entry = await prisma.timeEntry.findFirst({
    where: {
      userId: user.id,
      organizationId: user.organizationId,
      clockOut: null,
    },
    orderBy: { clockIn: "desc" },
  });
  if (!entry)
    return {
      error: "Du bist derzeit nicht eingestempelt.",
      status: 409,
    } as const;
  const extraBreak = entry.breakStartedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - entry.breakStartedAt.getTime()) / 60000),
      )
    : 0;
  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: {
      clockOut: new Date(),
      breakStartedAt: null,
      breakMinutes: { increment: extraBreak },
    },
  });
  return { entry: updated } as const;
}

export async function toggleBreak(user: ClockUser) {
  const entry = await prisma.timeEntry.findFirst({
    where: {
      userId: user.id,
      organizationId: user.organizationId,
      clockOut: null,
    },
  });
  if (!entry)
    return {
      error: "Du bist derzeit nicht eingestempelt.",
      status: 409,
    } as const;
  if (!entry.breakStartedAt) {
    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { breakStartedAt: new Date() },
    });
    return { entry: updated } as const;
  }
  const minutes = Math.max(
    1,
    Math.floor((Date.now() - entry.breakStartedAt.getTime()) / 60000),
  );
  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: { breakStartedAt: null, breakMinutes: { increment: minutes } },
  });
  return { entry: updated } as const;
}
