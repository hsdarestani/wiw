CREATE TABLE "ScheduleTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleTemplateItem" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "weekdayOffset" INTEGER NOT NULL,
  "startMinute" INTEGER NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "unpaidBreakMin" INTEGER NOT NULL DEFAULT 0,
  "locationId" TEXT NOT NULL,
  "positionId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "notes" TEXT,
  CONSTRAINT "ScheduleTemplateItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleTemplate_organizationId_name_key" ON "ScheduleTemplate"("organizationId", "name");
CREATE INDEX "ScheduleTemplate_organizationId_createdAt_idx" ON "ScheduleTemplate"("organizationId", "createdAt");
CREATE INDEX "ScheduleTemplateItem_templateId_weekdayOffset_idx" ON "ScheduleTemplateItem"("templateId", "weekdayOffset");
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateItem" ADD CONSTRAINT "ScheduleTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
