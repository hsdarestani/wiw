ALTER TABLE "Shift" ADD COLUMN "taskListId" TEXT;

CREATE TABLE "TaskList" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaskList_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TaskListItem" (
  "id" TEXT NOT NULL,
  "taskListId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TaskListItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ShiftTaskCompletion" (
  "id" TEXT NOT NULL,
  "shiftId" TEXT NOT NULL,
  "taskItemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShiftTaskCompletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaskList_organizationId_name_key" ON "TaskList"("organizationId", "name");
CREATE INDEX "TaskListItem_taskListId_sortOrder_idx" ON "TaskListItem"("taskListId", "sortOrder");
CREATE UNIQUE INDEX "ShiftTaskCompletion_shiftId_taskItemId_key" ON "ShiftTaskCompletion"("shiftId", "taskItemId");
CREATE INDEX "ShiftTaskCompletion_userId_completedAt_idx" ON "ShiftTaskCompletion"("userId", "completedAt");
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_taskListId_fkey" FOREIGN KEY ("taskListId") REFERENCES "TaskList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskList" ADD CONSTRAINT "TaskList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskListItem" ADD CONSTRAINT "TaskListItem_taskListId_fkey" FOREIGN KEY ("taskListId") REFERENCES "TaskList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftTaskCompletion" ADD CONSTRAINT "ShiftTaskCompletion_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftTaskCompletion" ADD CONSTRAINT "ShiftTaskCompletion_taskItemId_fkey" FOREIGN KEY ("taskItemId") REFERENCES "TaskListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftTaskCompletion" ADD CONSTRAINT "ShiftTaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
