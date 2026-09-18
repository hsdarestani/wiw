import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const taskList = await prisma.taskList.findFirst({ where: { id: (await params).id, organizationId: user.organizationId } });
  if (!taskList) return NextResponse.json({ error: "Aufgabenliste nicht gefunden." }, { status: 404 });
  await prisma.taskList.delete({ where: { id: taskList.id } });
  return NextResponse.json({ deleted: true });
}
