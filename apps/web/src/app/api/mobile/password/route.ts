import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ currentPassword: z.string().min(8).max(128), newPassword: z.string().min(10).max(128) }).refine((data) => data.currentPassword !== data.newPassword, { message: "Das neue Passwort muss sich unterscheiden." });
export async function PATCH(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bitte prüfe die Angaben." }, { status: 400 });
  if (!(await compare(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: "Das aktuelle Passwort ist falsch." }, { status: 403 });
  const passwordHash = await hash(parsed.data.newPassword, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, entityType: "User", entityId: user.id, action: "CHANGE_PASSWORD", reason: "Passwort sicher geändert" } });
  });
  return NextResponse.json({ ok: true });
}
