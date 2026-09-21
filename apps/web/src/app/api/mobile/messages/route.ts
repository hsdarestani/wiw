import { getMobileUser } from "@/lib/mobile-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const schema = z.object({ content: z.string().trim().min(1).max(2000) });
export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte gib eine Nachricht ein." }, { status: 400 });
  const recipients = await prisma.user.findMany({ where: { organizationId: user.organizationId, id: { not: user.id } }, select: { id: true } });
  await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { organizationId: user.organizationId, authorId: user.id, content: parsed.data.content } });
    if (recipients.length) await tx.notification.createMany({ data: recipients.map((recipient) => ({ organizationId: user.organizationId, userId: recipient.id, type: "MESSAGE", title: "Neue Teamnachricht", body: `${user.firstName} ${user.lastName}: ${parsed.data.content.slice(0, 120)}`, href: "/messages" })) });
    return created;
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
