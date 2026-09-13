import { prisma } from "./prisma";

export async function assignmentConflict(
  userId: string,
  startsAt: Date,
  endsAt: Date,
  excludeShiftId?: string,
) {
  const overlap = await prisma.shift.findFirst({
    where: {
      id: excludeShiftId ? { not: excludeShiftId } : undefined,
      assigneeId: userId,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });
  if (overlap)
    return "Der Mitarbeiter hat in diesem Zeitraum bereits eine Schicht.";
  const dayStart = new Date(startsAt);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const leave = await prisma.timeOffRequest.findFirst({
    where: {
      userId,
      status: "APPROVED",
      startsOn: { lt: dayEnd },
      endsOn: { gte: dayStart },
    },
    select: { id: true },
  });
  if (leave)
    return "Der Mitarbeiter hat für diesen Tag eine genehmigte Abwesenheit.";
  const rules = await prisma.availabilityRule.findMany({
    where: { userId, weekday: startsAt.getUTCDay() },
  });
  const startMinute = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const endMinute = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();
  if (
    rules.some(
      (rule) =>
        !rule.available &&
        startMinute < rule.endMinute &&
        endMinute > rule.startMinute,
    )
  )
    return "Der Mitarbeiter ist in diesem Zeitraum nicht verfügbar.";
  const available = rules.filter((rule) => rule.available);
  if (
    available.length &&
    !available.some(
      (rule) => startMinute >= rule.startMinute && endMinute <= rule.endMinute,
    )
  )
    return "Die Schicht liegt außerhalb der angegebenen Verfügbarkeit.";
  return null;
}
