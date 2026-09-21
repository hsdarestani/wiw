import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  hourlyRate: z.coerce.number().min(0).max(100000),
  isActive: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getMobileUser(request);
  if (!actor) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(actor.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Rolle, Status und Stundensatz prüfen." }, { status: 400 });
  const id = (await params).id;
  const target = await prisma.user.findFirst({ where: { id, organizationId: actor.organizationId } });
  if (!target) return NextResponse.json({ error: "Mitarbeiter nicht gefunden." }, { status: 404 });
  if (target.role === "OWNER" || target.id === actor.id) return NextResponse.json({ error: "Dieses Konto kann hier nicht geändert werden." }, { status: 409 });
  if (actor.role === "ADMIN" && target.role === "ADMIN") return NextResponse.json({ error: "Administratoren können andere Administratoren nicht ändern." }, { status: 403 });
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.user.update({ where: { id }, data: parsed.data });
    if (!parsed.data.isActive) await tx.session.deleteMany({ where: { userId: id } });
    await tx.auditLog.create({ data: { organizationId: actor.organizationId, actorId: actor.id, entityType: "User", entityId: id, action: "UPDATE_EMPLOYEE", reason: parsed.data.isActive ? "Mitarbeiterdaten mobil geändert" : "Mitarbeiter mobil deaktiviert", before: { role: target.role, hourlyRate: String(target.hourlyRate), isActive: target.isActive }, after: { role: next.role, hourlyRate: String(next.hourlyRate), isActive: next.isActive } } });
    return next;
  });
  return NextResponse.json({ employee: { id: updated.id, role: updated.role, hourlyRate: Number(updated.hourlyRate), isActive: updated.isActive } });
}
