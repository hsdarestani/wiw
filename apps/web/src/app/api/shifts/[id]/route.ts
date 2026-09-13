import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assignmentConflict } from "@/lib/scheduling-policy";

const updateSchema = z.object({
  assigneeId: z.string().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Ungültige Schichtdaten." },
      { status: 400 },
    );
  const { id } = await params;
  const startsAt = new Date(parsed.data.startsAt),
    endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt)
    return NextResponse.json(
      { error: "Das Schichtende muss nach dem Beginn liegen." },
      { status: 400 },
    );
  const shift = await prisma.shift.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!shift)
    return NextResponse.json(
      { error: "Schicht nicht gefunden." },
      { status: 404 },
    );
  if (parsed.data.assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: parsed.data.assigneeId,
        organizationId: user.organizationId,
      },
    });
    if (!assignee)
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 },
      );
    const conflict = await assignmentConflict(
      assignee.id,
      startsAt,
      endsAt,
      id,
    );
    if (conflict)
      return NextResponse.json({ error: conflict }, { status: 409 });
  }
  const updated = await prisma.shift.update({
    where: { id },
    data: {
      assigneeId: parsed.data.assigneeId,
      startsAt,
      endsAt,
      status: parsed.data.assigneeId ? "DRAFT" : "OPEN",
    },
  });
  return NextResponse.json({ shift: updated });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const { id } = await params;
  const result = await prisma.shift.deleteMany({
    where: { id, organizationId: user.organizationId },
  });
  if (!result.count)
    return NextResponse.json(
      { error: "Schicht nicht gefunden." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
