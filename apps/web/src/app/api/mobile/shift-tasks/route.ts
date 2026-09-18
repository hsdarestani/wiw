import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ shiftId: z.string(), taskItemId: z.string(), completed: z.boolean() });
export async function POST(request: Request) {
  const user = await getMobileUser(request); if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Ungültige Aufgabe." }, { status: 400 });
  const shift = await prisma.shift.findFirst({ where: { id: parsed.data.shiftId, organizationId: user.organizationId, assigneeId: user.id }, include: { taskList: { include: { items: true } } } });
  if (!shift?.taskList || !shift.taskList.items.some((item) => item.id === parsed.data.taskItemId)) return NextResponse.json({ error: "Aufgabe nicht gefunden." }, { status: 404 });
  if (parsed.data.completed) await prisma.shiftTaskCompletion.upsert({ where: { shiftId_taskItemId: { shiftId: shift.id, taskItemId: parsed.data.taskItemId } }, create: { shiftId: shift.id, taskItemId: parsed.data.taskItemId, userId: user.id }, update: { userId: user.id, completedAt: new Date() } });
  else await prisma.shiftTaskCompletion.deleteMany({ where: { shiftId: shift.id, taskItemId: parsed.data.taskItemId, userId: user.id } });
  return NextResponse.json({ completed: parsed.data.completed });
}
