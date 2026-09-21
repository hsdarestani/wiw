import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const parseDate = (value: string | null, fallback: Date) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
};
const csv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const actor = await getMobileUser(request);
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const url = new URL(request.url), today = new Date();
  const from = parseDate(url.searchParams.get("from"), new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
  const to = parseDate(url.searchParams.get("to"), today), until = new Date(to); until.setUTCDate(until.getUTCDate() + 1);
  if (to < from) return NextResponse.json({ error: "Das Enddatum muss nach dem Startdatum liegen." }, { status: 400 });
  const rawStatus = url.searchParams.get("status") ?? "APPROVED";
  const status = ["ALL", "PENDING", "APPROVED", "DECLINED"].includes(rawStatus) ? rawStatus : "APPROVED";
  const entries = await prisma.timeEntry.findMany({ where: { organizationId: actor.organizationId, clockOut: { not: null }, clockIn: { gte: from, lt: until }, ...(status === "ALL" ? {} : { approvalStatus: status as "PENDING" | "APPROVED" | "DECLINED" }) }, include: { user: true, location: true }, orderBy: [{ user: { lastName: "asc" } }, { clockIn: "asc" }] });
  const grouped = new Map<string, { id: string; name: string; rate: number; minutes: number; entries: number }>();
  const detail = entries.map((entry) => {
    const minutes = Math.max(0, Math.round((entry.clockOut!.getTime() - entry.clockIn.getTime()) / 60000 - entry.breakMinutes));
    const rate = Number(entry.user.hourlyRate), current = grouped.get(entry.userId) ?? { id: entry.userId, name: `${entry.user.firstName} ${entry.user.lastName}`.trim(), rate, minutes: 0, entries: 0 };
    current.minutes += minutes; current.entries += 1; grouped.set(entry.userId, current);
    return { entry, minutes, rate };
  });
  const people = [...grouped.values()].map((item) => ({ ...item, hours: item.minutes / 60, payroll: (item.minutes / 60) * item.rate }));
  const totalMinutes = people.reduce((sum, item) => sum + item.minutes, 0), totalPayroll = people.reduce((sum, item) => sum + item.payroll, 0);
  const header = ["Mitarbeiter", "Datum", "Beginn", "Ende", "Pause (Min.)", "Arbeitszeit (Std.)", "Stundensatz (EUR)", "Lohnkosten (EUR)", "Status", "Standort"].map(csv).join(";");
  const lines = detail.map(({ entry, minutes, rate }) => [`${entry.user.firstName} ${entry.user.lastName}`.trim(), entry.clockIn.toLocaleDateString("de-DE", { timeZone: "UTC" }), entry.clockIn.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }), entry.clockOut!.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }), entry.breakMinutes, (minutes / 60).toFixed(2).replace(".", ","), rate.toFixed(2).replace(".", ","), ((minutes / 60) * rate).toFixed(2).replace(".", ","), entry.approvalStatus, entry.location?.name ?? ""].map(csv).join(";"));
  return NextResponse.json({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), status, totalHours: totalMinutes / 60, totalPayroll, entryCount: entries.length, people, filename: `schichtpro-lohn-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`, csv: `\uFEFF${[header, ...lines].join("\r\n")}` });
}
