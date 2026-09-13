CREATE TYPE "ShiftTradeKind" AS ENUM ('OPEN_SHIFT', 'SWAP');
CREATE TYPE "ShiftTradeStatus" AS ENUM ('OFFERED', 'PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

CREATE TABLE "ShiftTrade" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "ownerId" TEXT,
    "claimantId" TEXT,
    "reviewedById" TEXT,
    "kind" "ShiftTradeKind" NOT NULL,
    "status" "ShiftTradeStatus" NOT NULL DEFAULT 'OFFERED',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShiftTrade_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShiftTrade_organizationId_status_createdAt_idx" ON "ShiftTrade"("organizationId", "status", "createdAt");
CREATE INDEX "ShiftTrade_shiftId_status_idx" ON "ShiftTrade"("shiftId", "status");
CREATE INDEX "ShiftTrade_claimantId_status_idx" ON "ShiftTrade"("claimantId", "status");

ALTER TABLE "ShiftTrade" ADD CONSTRAINT "ShiftTrade_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftTrade" ADD CONSTRAINT "ShiftTrade_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftTrade" ADD CONSTRAINT "ShiftTrade_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShiftTrade" ADD CONSTRAINT "ShiftTrade_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShiftTrade" ADD CONSTRAINT "ShiftTrade_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
