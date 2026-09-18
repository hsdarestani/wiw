import { Prisma, TimeEntrySource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ClockUser = { id: string; organizationId: string };
type Coordinates = { latitude: number; longitude: number; accuracy?: number };
const distanceMeters = (a: Coordinates, b: Coordinates) => {
  const toRad = (value: number) => value * Math.PI / 180, earth = 6371000;
  const dLat = toRad(b.latitude - a.latitude), dLon = toRad(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(value));
};

export async function clockIn(user: ClockUser, source: TimeEntrySource, coordinates?: Coordinates) {
  const existing = await prisma.timeEntry.findFirst({
    where: { userId: user.id, clockOut: null },
  });
  if (existing)
    return { error: "Du bist bereits eingestempelt.", status: 409 } as const;
  const geofences = await prisma.location.findMany({ where: { organizationId: user.organizationId, latitude: { not: null }, longitude: { not: null } } });
  let matchedLocation: (typeof geofences)[number] | undefined;
  if (geofences.length) {
    if (!coordinates) return { error: "Für diesen Arbeitsplatz ist der Standort beim Einstempeln erforderlich.", status: 400 } as const;
    matchedLocation = geofences.map((location) => ({ location, distance: distanceMeters(coordinates, { latitude: location.latitude!, longitude: location.longitude! }) })).filter((item) => item.distance <= item.location.geofenceRadius + Math.min(coordinates.accuracy ?? 0, 100)).sort((a, b) => a.distance - b.distance)[0]?.location;
    if (!matchedLocation) return { error: "Du befindest dich außerhalb des erlaubten Arbeitsbereichs.", status: 403 } as const;
  }
  try {
    const entry = await prisma.timeEntry.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        clockIn: new Date(),
        source,
        locationId: matchedLocation?.id,
        clockInLatitude: coordinates?.latitude,
        clockInLongitude: coordinates?.longitude,
        clockInAccuracy: coordinates?.accuracy,
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
