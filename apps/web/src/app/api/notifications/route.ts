import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.union([z.object({ id: z.string().cuid() }), z.object({ all: z.literal(true) })]);
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null, ...("id" in parsed.data ? { id: parsed.data.id } : {}) }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
