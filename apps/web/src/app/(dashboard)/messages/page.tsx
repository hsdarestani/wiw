import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagesPanel } from "./messages-panel";
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const user = await getCurrentUser(); if (!user) return null;
  const [conversations, members] = await Promise.all([
    prisma.conversation.findMany({ where: { organizationId: user.organizationId, participants: { some: { userId: user.id } } }, include: { participants: { include: { user: true } }, messages: { include: { author: true }, orderBy: { createdAt: "asc" }, take: 200 } }, orderBy: { updatedAt: "desc" } }),
    prisma.user.findMany({ where: { organizationId: user.organizationId, isActive: true, id: { not: user.id } }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
  ]);
  const requested = (await searchParams).conversation, selectedId = conversations.some((x) => x.id === requested) ? requested! : conversations[0]?.id ?? null;
  return <MessagesPanel currentUserId={user.id} selectedId={selectedId} members={members.map((x) => ({ id: x.id, name: `${x.firstName} ${x.lastName}`.trim() }))} conversations={conversations.map((conversation) => { const mine = conversation.participants.find((p) => p.userId === user.id), others = conversation.participants.filter((p) => p.userId !== user.id); return { id: conversation.id, title: conversation.isGroup ? conversation.name || "Gruppe" : others.map((p) => `${p.user.firstName} ${p.user.lastName}`.trim()).join(", ") || "Nur du", isGroup: conversation.isGroup, unread: conversation.messages.filter((m) => m.authorId !== user.id && (!mine?.lastReadAt || m.createdAt > mine.lastReadAt)).length, messages: conversation.messages.map((m) => ({ id: m.id, content: m.content, createdAt: m.createdAt.toISOString(), authorId: m.authorId, authorName: `${m.author.firstName} ${m.author.lastName}`.trim(), readCount: conversation.participants.filter((p) => p.userId !== m.authorId && p.lastReadAt && p.lastReadAt >= m.createdAt).length, recipientCount: conversation.participants.length - 1 })) }; })} />;
}
