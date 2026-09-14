ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "User_organizationId_isActive_idx" ON "User"("organizationId", "isActive");
