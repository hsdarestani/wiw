import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]), hourlyRate: z.coerce.number().min(0).max(100000), isActive: z.boolean() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte prüfe Rolle, Status und Stundensatz." }, { status: 400 });
  const { id } = await params;
  const target = await prisma.user.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!target) return NextResponse.json({ error: "Mitarbeiter nicht gefunden." }, { status: 404 });
  if (target.role === "OWNER" || target.id === user.id) return NextResponse.json({ error: "Das eigene Inhaberkonto kann hier nicht geändert werden." }, { status: 409 });
  if (user.role === "ADMIN" && target.role === "ADMIN") return NextResponse.json({ error: "Administratoren können andere Administratoren nicht ändern." }, { status: 403 });
  const data = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.user.update({ where: { id }, data: { role: data.role, hourlyRate: data.hourlyRate, isActive: data.isActive } });
    if (!data.isActive) await tx.session.deleteMany({ where: { userId: id } });
    await tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, entityType: "User", entityId: id, action: "UPDATE_EMPLOYEE", reason: data.isActive ? "Mitarbeiterdaten geändert" : "Mitarbeiter deaktiviert", before: { role: target.role, hourlyRate: String(target.hourlyRate), isActive: target.isActive }, after: { role: next.role, hourlyRate: String(next.hourlyRate), isActive: next.isActive } } });
    return next;
  });
  return NextResponse.json({ employee: { id: updated.id, role: updated.role, hourlyRate: String(updated.hourlyRate), isActive: updated.isActive } });
}
