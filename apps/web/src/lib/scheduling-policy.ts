import { prisma } from "./prisma";

export async function assignmentConflict(userId: string, startsAt: Date, endsAt: Date, excludeShiftId?: string) {
  const employee = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!employee?.isActive) return "Das Mitarbeiterkonto ist inaktiv.";
  const overlap = await prisma.shift.findFirst({ where: { id: excludeShiftId ? { not: excludeShiftId } : undefined, assigneeId: userId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
  if (overlap) return "Der Mitarbeiter hat in diesem Zeitraum bereits eine Schicht.";

  const firstDay = new Date(startsAt); firstDay.setUTCHours(0, 0, 0, 0);
  const lastDay = new Date(endsAt); lastDay.setUTCHours(0, 0, 0, 0);
  const leaveEnd = new Date(lastDay); leaveEnd.setUTCDate(leaveEnd.getUTCDate() + 1);
  const leave = await prisma.timeOffRequest.findFirst({ where: { userId, status: "APPROVED", startsOn: { lt: leaveEnd }, endsOn: { gte: firstDay } }, select: { id: true } });
  if (leave) return "Der Mitarbeiter hat in diesem Zeitraum eine genehmigte Abwesenheit.";

  const days: Array<{ weekday: number; startMinute: number; endMinute: number }> = [];
  for (let day = new Date(firstDay); day <= lastDay; day.setUTCDate(day.getUTCDate() + 1)) {
    const nextDay = new Date(day); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const segmentStart = startsAt > day ? startsAt : day;
    const segmentEnd = endsAt < nextDay ? endsAt : nextDay;
    if (segmentEnd <= segmentStart) continue;
    days.push({ weekday: day.getUTCDay(), startMinute: segmentStart.getUTCHours() * 60 + segmentStart.getUTCMinutes(), endMinute: segmentEnd.getTime() === nextDay.getTime() ? 1440 : segmentEnd.getUTCHours() * 60 + segmentEnd.getUTCMinutes() });
  }
  const rules = await prisma.availabilityRule.findMany({ where: { userId, weekday: { in: [...new Set(days.map((day) => day.weekday))] } } });
  for (const day of days) {
    const dayRules = rules.filter((rule) => rule.weekday === day.weekday);
    if (dayRules.some((rule) => !rule.available && day.startMinute < rule.endMinute && day.endMinute > rule.startMinute)) return "Der Mitarbeiter ist in diesem Zeitraum nicht verfügbar.";
    const available = dayRules.filter((rule) => rule.available);
    if (available.length && !available.some((rule) => day.startMinute >= rule.startMinute && day.endMinute <= rule.endMinute)) return "Die Schicht liegt außerhalb der angegebenen Verfügbarkeit.";
  }
  return null;
}
