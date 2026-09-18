import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().trim().min(1).max(80), items: z.array(z.string().trim().min(1).max(160)).min(1).max(40) });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name und mindestens eine Aufgabe sind erforderlich." }, { status: 400 });
  try {
    const taskList = await prisma.taskList.create({ data: { organizationId: user.organizationId, name: parsed.data.name, items: { create: parsed.data.items.map((title, sortOrder) => ({ title, sortOrder })) } }, include: { items: true } });
    return NextResponse.json({ taskList }, { status: 201 });
  } catch { return NextResponse.json({ error: "Eine Aufgabenliste mit diesem Namen existiert bereits." }, { status: 409 }); }
}
