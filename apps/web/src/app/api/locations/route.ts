import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ name: z.string().trim().min(2).max(100) });
const deleteSchema = z.object({ id: z.string().cuid() });
const manager = (role: string) => ["OWNER", "ADMIN", "MANAGER"].includes(role);
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!manager(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte gib einen gültigen Namen ein." }, { status: 400 });
  const exists = await prisma.location.findFirst({ where: { organizationId: user.organizationId, name: { equals: parsed.data.name, mode: "insensitive" } } });
  if (exists) return NextResponse.json({ error: "Dieser Standort existiert bereits." }, { status: 409 });
  const location = await prisma.location.create({ data: { organizationId: user.organizationId, name: parsed.data.name } });
  return NextResponse.json({ location }, { status: 201 });
}
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!manager(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Standort." }, { status: 400 });
  const location = await prisma.location.findFirst({ where: { id: parsed.data.id, organizationId: user.organizationId }, include: { _count: { select: { shifts: true, invitations: true, timeEntries: true } } } });
  if (!location) return NextResponse.json({ error: "Standort nicht gefunden." }, { status: 404 });
  if (location._count.shifts + location._count.invitations + location._count.timeEntries > 0) return NextResponse.json({ error: "Der Standort wird noch verwendet und kann nicht gelöscht werden." }, { status: 409 });
  await prisma.location.delete({ where: { id: location.id } });
  return NextResponse.json({ ok: true });
}
