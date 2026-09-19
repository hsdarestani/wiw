ALTER TABLE "Organization" ADD COLUMN "clockRoundingMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "clockGraceMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "autoBreakAfterMinutes" INTEGER;
ALTER TABLE "Organization" ADD COLUMN "autoBreakMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TimeEntry" ADD COLUMN "actualClockIn" TIMESTAMP(3);
ALTER TABLE "TimeEntry" ADD COLUMN "actualClockOut" TIMESTAMP(3);
