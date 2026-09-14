import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ name: z.string().trim().min(2).max(100), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#168b7e") });
const deleteSchema = z.object({ id: z.string().cuid() });
const manager = (role: string) => ["OWNER", "ADMIN", "MANAGER"].includes(role);
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!manager(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte prüfe Name und Farbe." }, { status: 400 });
  const exists = await prisma.position.findFirst({ where: { organizationId: user.organizationId, name: { equals: parsed.data.name, mode: "insensitive" } } });
  if (exists) return NextResponse.json({ error: "Diese Position existiert bereits." }, { status: 409 });
  const position = await prisma.position.create({ data: { organizationId: user.organizationId, name: parsed.data.name, color: parsed.data.color } });
  return NextResponse.json({ position }, { status: 201 });
}
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!manager(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Position." }, { status: 400 });
  const position = await prisma.position.findFirst({ where: { id: parsed.data.id, organizationId: user.organizationId }, include: { _count: { select: { shifts: true } } } });
  if (!position) return NextResponse.json({ error: "Position nicht gefunden." }, { status: 404 });
  if (position._count.shifts > 0) return NextResponse.json({ error: "Die Position wird noch im Dienstplan verwendet." }, { status: 409 });
  await prisma.position.delete({ where: { id: position.id } });
  return NextResponse.json({ ok: true });
}
