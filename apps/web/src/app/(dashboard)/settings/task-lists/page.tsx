import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskListManager } from "./task-list-manager";
export default async function TaskListsPage() {
  const user = await getCurrentUser(); if (!user) return null;
  const taskLists = await prisma.taskList.findMany({ where: { organizationId: user.organizationId }, include: { items: { orderBy: { sortOrder: "asc" } }, _count: { select: { shifts: true } } }, orderBy: { name: "asc" } });
  return <TaskListManager taskLists={taskLists.map((list) => ({ id: list.id, name: list.name, items: list.items.map((item) => item.title), shiftCount: list._count.shifts }))} />;
}
