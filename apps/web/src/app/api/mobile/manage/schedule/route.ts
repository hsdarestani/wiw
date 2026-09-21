import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const actor = await getMobileUser(request);
  if (!actor || !["OWNER", "ADMIN", "MANAGER"].includes(actor.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const url = new URL(request.url), from = new Date(url.searchParams.get("from") ?? ""), to = new Date(url.searchParams.get("to") ?? "");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  const shifts = await prisma.shift.findMany({ where: { organizationId: actor.organizationId, startsAt: { gte: from, lt: to } }, include: { assignee: true, location: true, position: true }, orderBy: { startsAt: "asc" } });
  return NextResponse.json({ shifts: shifts.map((shift) => ({ id: shift.id, assigneeId: shift.assigneeId, assignee: shift.assignee ? `${shift.assignee.firstName} ${shift.assignee.lastName}`.trim() : "OpenShift", startsAt: shift.startsAt.toISOString(), endsAt: shift.endsAt.toISOString(), breakMinutes: shift.unpaidBreakMin, status: shift.status, location: shift.location.name, position: shift.position.name, color: shift.position.color })) });
}
