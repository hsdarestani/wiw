import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";

const schema = z.object({
  assigneeId: z.string().nullable(),
  locationId: z.string(),
  positionId: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  unpaidBreakMin: z.number().int().min(0).max(480).default(0),
  notes: z.string().max(500).optional(),
  taskListId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe die Schichtangaben." },
      { status: 400 },
    );
  const startsAt = new Date(parsed.data.startsAt),
    endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt)
    return NextResponse.json(
      { error: "Das Schichtende muss nach dem Beginn liegen." },
      { status: 400 },
    );
  const [location, position, assignee, taskList] = await Promise.all([
    prisma.location.findFirst({
      where: {
        id: parsed.data.locationId,
        organizationId: user.organizationId,
      },
    }),
    prisma.position.findFirst({
      where: {
        id: parsed.data.positionId,
        organizationId: user.organizationId,
      },
    }),
    parsed.data.assigneeId
      ? prisma.user.findFirst({
          where: {
            id: parsed.data.assigneeId,
            organizationId: user.organizationId,
          },
        })
      : null,
    parsed.data.taskListId ? prisma.taskList.findFirst({ where: { id: parsed.data.taskListId, organizationId: user.organizationId } }) : null,
  ]);
  if (!location || !position || (parsed.data.assigneeId && !assignee) || (parsed.data.taskListId && !taskList))
    return NextResponse.json(
      { error: "Mitarbeiter, Standort oder Position ist ungültig." },
      { status: 400 },
    );
  if (assignee) {
    const conflict = await assignmentConflict(assignee.id, startsAt, endsAt);
    if (conflict)
      return NextResponse.json({ error: conflict }, { status: 409 });
  }
  const shift = await prisma.shift.create({
    data: {
      organizationId: user.organizationId,
      locationId: location.id,
      positionId: position.id,
      assigneeId: assignee?.id || null,
      startsAt,
      endsAt,
      unpaidBreakMin: parsed.data.unpaidBreakMin,
      notes: parsed.data.notes || null,
      status: assignee ? "DRAFT" : "OPEN",
      taskListId: taskList?.id ?? null,
    },
  });
  return NextResponse.json({ shift }, { status: 201 });
}
