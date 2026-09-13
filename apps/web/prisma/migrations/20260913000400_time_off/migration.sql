CREATE TYPE "TimeOffType" AS ENUM ('VACATION', 'SICK', 'UNPAID', 'OTHER');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');
CREATE TABLE "TimeOffRequest" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "startsOn" DATE NOT NULL, "endsOn" DATE NOT NULL, "requestType" "TimeOffType" NOT NULL,
  "note" TEXT, "status" "RequestStatus" NOT NULL DEFAULT 'PENDING', "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TimeOffRequest_organizationId_status_startsOn_idx" ON "TimeOffRequest"("organizationId", "status", "startsOn");
CREATE INDEX "TimeOffRequest_userId_startsOn_idx" ON "TimeOffRequest"("userId", "startsOn");
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
