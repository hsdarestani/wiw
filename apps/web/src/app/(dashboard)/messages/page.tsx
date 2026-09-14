import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagesPanel } from "./messages-panel";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const messages = await prisma.message.findMany({
    where: { organizationId: user.organizationId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return (
    <MessagesPanel
      currentUserId={user.id}
      messages={messages.map((item) => ({
        id: item.id,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
        authorId: item.authorId,
        authorName: `${item.author.firstName} ${item.author.lastName}`,
        role: item.author.role,
      }))}
    />
  );
}
