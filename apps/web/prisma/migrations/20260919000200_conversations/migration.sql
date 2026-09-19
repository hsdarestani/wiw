CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "name" TEXT, "isGroup" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConversationParticipant" (
  "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "userId" TEXT NOT NULL, "lastReadAt" TIMESTAMP(3), "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConversationMessage" (
  "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "authorId" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Conversation_organizationId_updatedAt_idx" ON "Conversation"("organizationId", "updatedAt");
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_conversationId_idx" ON "ConversationParticipant"("userId", "conversationId");
CREATE INDEX "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Conversation" ("id", "organizationId", "name", "isGroup", "createdById", "createdAt", "updatedAt")
SELECT 'legacy-team-' || o."id", o."id", 'Team-Chat', true, MIN(u."id"), MIN(o."createdAt"), CURRENT_TIMESTAMP
FROM "Organization" o JOIN "User" u ON u."organizationId" = o."id" GROUP BY o."id";
INSERT INTO "ConversationParticipant" ("id", "conversationId", "userId", "joinedAt")
SELECT 'legacy-part-' || u."id", 'legacy-team-' || u."organizationId", u."id", u."createdAt" FROM "User" u;
INSERT INTO "ConversationMessage" ("id", "conversationId", "authorId", "content", "createdAt")
SELECT 'legacy-msg-' || m."id", 'legacy-team-' || m."organizationId", m."authorId", m."content", m."createdAt" FROM "Message" m;
