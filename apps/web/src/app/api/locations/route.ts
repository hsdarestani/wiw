import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ name: z.string().trim().min(2).max(100) });
const deleteSchema = z.object({ id: z.string().cuid() });
const geofenceSchema = z.object({ id: z.string().cuid(), latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(), geofenceRadius: z.number().int().min(50).max(5000) });
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
export async function PATCH(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!manager(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = geofenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.latitude === null) !== (parsed.data.longitude === null)) return NextResponse.json({ error: "Bitte gültige Koordinaten und einen Radius angeben." }, { status: 400 });
  const updated = await prisma.location.updateMany({ where: { id: parsed.data.id, organizationId: user.organizationId }, data: { latitude: parsed.data.latitude, longitude: parsed.data.longitude, geofenceRadius: parsed.data.geofenceRadius } });
  if (!updated.count) return NextResponse.json({ error: "Standort nicht gefunden." }, { status: 404 });
  return NextResponse.json({ updated: true });
}
