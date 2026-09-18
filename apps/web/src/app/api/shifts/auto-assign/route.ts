import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });
type Window = { startsAt: Date; endsAt: Date };

function overlaps(a: Window, b: Window) { return a.startsAt < b.endsAt && a.endsAt > b.startsAt; }
function durationMinutes(shift: Window & { unpaidBreakMin: number }) { return Math.max(0, Math.round((shift.endsAt.getTime() - shift.startsAt.getTime()) / 60000) - shift.unpaidBreakMin); }
function availableFor(shift: Window, rules: Array<{ weekday: number; startMinute: number; endMinute: number; available: boolean }>) {
  const first = new Date(shift.startsAt); first.setUTCHours(0, 0, 0, 0);
  const last = new Date(shift.endsAt); last.setUTCHours(0, 0, 0, 0);
  for (let day = new Date(first); day <= last; day.setUTCDate(day.getUTCDate() + 1)) {
    const next = new Date(day); next.setUTCDate(next.getUTCDate() + 1);
    const segmentStart = shift.startsAt > day ? shift.startsAt : day;
    const segmentEnd = shift.endsAt < next ? shift.endsAt : next;
    if (segmentEnd <= segmentStart) continue;
    const startMinute = segmentStart.getUTCHours() * 60 + segmentStart.getUTCMinutes();
    const endMinute = segmentEnd.getTime() === next.getTime() ? 1440 : segmentEnd.getUTCHours() * 60 + segmentEnd.getUTCMinutes();
    const dayRules = rules.filter((rule) => rule.weekday === day.getUTCDay());
    if (dayRules.some((rule) => !rule.available && startMinute < rule.endMinute && endMinute > rule.startMinute)) return false;
    const positive = dayRules.filter((rule) => rule.available);
    if (positive.length && !positive.some((rule) => startMinute >= rule.startMinute && endMinute <= rule.endMinute)) return false;
  }
  return true;
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Woche." }, { status: 400 });
  const weekStart = new Date(parsed.data.startsAt), weekEnd = new Date(parsed.data.endsAt);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const [openShifts, employees, existing, rules, leave] = await Promise.all([
        tx.shift.findMany({ where: { organizationId: actor.organizationId, assigneeId: null, status: "OPEN", startsAt: { gte: weekStart, lt: weekEnd } }, orderBy: { startsAt: "asc" } }),
        tx.user.findMany({ where: { organizationId: actor.organizationId, isActive: true }, select: { id: true, firstName: true, lastName: true } }),
        tx.shift.findMany({ where: { organizationId: actor.organizationId, assigneeId: { not: null }, startsAt: { lt: weekEnd }, endsAt: { gt: weekStart } }, select: { assigneeId: true, startsAt: true, endsAt: true, unpaidBreakMin: true } }),
        tx.availabilityRule.findMany({ where: { organizationId: actor.organizationId } }),
        tx.timeOffRequest.findMany({ where: { organizationId: actor.organizationId, status: "APPROVED", startsOn: { lt: weekEnd }, endsOn: { gte: weekStart } }, select: { userId: true, startsOn: true, endsOn: true } }),
      ]);
      const planned = new Map<string, Window[]>(), minutes = new Map<string, number>();
      for (const employee of employees) { planned.set(employee.id, []); minutes.set(employee.id, 0); }
      for (const shift of existing) if (shift.assigneeId && planned.has(shift.assigneeId)) { planned.get(shift.assigneeId)!.push(shift); minutes.set(shift.assigneeId, (minutes.get(shift.assigneeId) ?? 0) + durationMinutes(shift)); }
      const assignments: Array<{ shiftId: string; userId: string; name: string }> = [];
      for (const shift of openShifts) {
        const candidates = employees.filter((employee) => {
          if (planned.get(employee.id)!.some((item) => overlaps(item, shift))) return false;
          if (!availableFor(shift, rules.filter((rule) => rule.userId === employee.id))) return false;
          const shiftLastDay = new Date(shift.endsAt); shiftLastDay.setUTCHours(0, 0, 0, 0);
          return !leave.some((item) => item.userId === employee.id && item.startsOn <= shiftLastDay && item.endsOn >= new Date(new Date(shift.startsAt).setUTCHours(0, 0, 0, 0)));
        }).sort((a, b) => (minutes.get(a.id) ?? 0) - (minutes.get(b.id) ?? 0) || a.id.localeCompare(b.id));
        const selected = candidates[0]; if (!selected) continue;
        const updated = await tx.shift.updateMany({ where: { id: shift.id, organizationId: actor.organizationId, assigneeId: null, status: "OPEN" }, data: { assigneeId: selected.id, status: "DRAFT" } });
        if (updated.count !== 1) throw new Error("schedule_changed");
        planned.get(selected.id)!.push(shift); minutes.set(selected.id, (minutes.get(selected.id) ?? 0) + durationMinutes(shift));
        assignments.push({ shiftId: shift.id, userId: selected.id, name: `${selected.firstName} ${selected.lastName}`.trim() });
      }
      if (assignments.length) await tx.notification.createMany({ data: assignments.map((item) => ({ organizationId: actor.organizationId, userId: item.userId, type: "SHIFT_ASSIGNED", title: "Neue Schicht zugewiesen", body: "Eine offene Schicht wurde dir automatisch zugewiesen.", href: "/schedule" })) });
      return { assigned: assignments.length, skipped: openShifts.length - assignments.length, assignments };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "schedule_changed") return NextResponse.json({ error: "Der Dienstplan wurde parallel geändert. Bitte erneut versuchen." }, { status: 409 });
    return NextResponse.json({ error: "Automatische Zuweisung konnte nicht abgeschlossen werden." }, { status: 500 });
  }
}
