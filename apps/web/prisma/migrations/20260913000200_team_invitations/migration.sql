CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "email" TEXT,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invitation_code_key" ON "Invitation"("code");
CREATE INDEX "Invitation_organizationId_createdAt_idx" ON "Invitation"("organizationId", "createdAt");
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
