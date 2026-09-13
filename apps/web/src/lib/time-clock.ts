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
  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: { clockOut: new Date() },
  });
  return { entry: updated } as const;
}
