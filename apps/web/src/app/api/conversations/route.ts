import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ name: z.string().trim().max(80).optional(), participantIds: z.array(z.string()).min(1).max(100) });
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Bitte Mitglieder auswählen." }, { status: 400 });
  const ids = [...new Set([user.id, ...parsed.data.participantIds])];
  const members = await prisma.user.findMany({ where: { organizationId: user.organizationId, id: { in: ids }, isActive: true }, select: { id: true } });
  if (members.length !== ids.length) return NextResponse.json({ error: "Mindestens ein Mitglied ist ungültig." }, { status: 400 });
  if (ids.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: {
        organizationId: user.organizationId,
        isGroup: false,
        AND: ids.map((id) => ({ participants: { some: { userId: id } } })),
        participants: { every: { userId: { in: ids } } },
      },
    });
    if (existing) return NextResponse.json({ conversation: existing });
  }
  const conversation = await prisma.conversation.create({ data: { organizationId: user.organizationId, createdById: user.id, isGroup: ids.length > 2, name: ids.length > 2 ? parsed.data.name || "Neue Gruppe" : null, participants: { create: ids.map((userId) => ({ userId, lastReadAt: userId === user.id ? new Date() : null })) } } });
  return NextResponse.json({ conversation }, { status: 201 });
}
