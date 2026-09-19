import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ content: z.string().trim().min(1).max(2000) });
async function member(userId: string, conversationId: string) { return prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, include: { conversation: true } }); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 }); const id = (await params).id;
  const membership = await member(user.id, id); if (!membership || membership.conversation.organizationId !== user.organizationId) return NextResponse.json({ error: "Unterhaltung nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Bitte gib eine Nachricht ein." }, { status: 400 });
  const recipients = await prisma.conversationParticipant.findMany({ where: { conversationId: id, userId: { not: user.id } }, select: { userId: true } });
  const message = await prisma.$transaction(async (tx) => { const created = await tx.conversationMessage.create({ data: { conversationId: id, authorId: user.id, content: parsed.data.content } }); await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } }); await tx.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: user.id } }, data: { lastReadAt: new Date() } }); if (recipients.length) await tx.notification.createMany({ data: recipients.map((recipient) => ({ organizationId: user.organizationId, userId: recipient.userId, type: "MESSAGE", title: "Neue Nachricht", body: `${user.firstName} ${user.lastName}: ${parsed.data.content.slice(0, 120)}`, href: `/messages?conversation=${id}` })) }); return created; });
  return NextResponse.json({ message }, { status: 201 });
}
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 }); const id = (await params).id;
  const result = await prisma.conversationParticipant.updateMany({ where: { conversationId: id, userId: user.id, conversation: { organizationId: user.organizationId } }, data: { lastReadAt: new Date() } });
  if (!result.count) return NextResponse.json({ error: "Unterhaltung nicht gefunden." }, { status: 404 }); return NextResponse.json({ read: true });
}
