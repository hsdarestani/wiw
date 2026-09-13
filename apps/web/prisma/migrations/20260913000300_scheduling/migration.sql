CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OPEN');
ALTER TABLE "User" ADD COLUMN "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0;
CREATE TABLE "Position" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "color" TEXT NOT NULL DEFAULT '#168b7e',
  "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Shift" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "locationId" TEXT NOT NULL,
  "positionId" TEXT NOT NULL, "assigneeId" TEXT, "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL, "unpaidBreakMin" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT, "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Position_organizationId_name_key" ON "Position"("organizationId", "name");
CREATE INDEX "Shift_organizationId_startsAt_idx" ON "Shift"("organizationId", "startsAt");
CREATE INDEX "Shift_assigneeId_startsAt_idx" ON "Shift"("assigneeId", "startsAt");
ALTER TABLE "Position" ADD CONSTRAINT "Position_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Position" ("id", "name", "color", "organizationId", "createdAt")
SELECT 'pos_' || md5(random()::text || "id"), 'Allgemein', '#168b7e', "id", CURRENT_TIMESTAMP FROM "Organization";
