import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const time = /^([01]\d|2[0-3]):[0-5]\d$/;
const schema = z.object({
  weekday: z.number().int().min(0).max(6),
  startsAt: z.string().regex(time),
  endsAt: z.string().regex(time),
  available: z.boolean(),
});
const minutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe die Zeitangaben." },
      { status: 400 },
    );
  const startMinute = minutes(parsed.data.startsAt),
    endMinute = minutes(parsed.data.endsAt);
  if (endMinute <= startMinute)
    return NextResponse.json(
      { error: "Das Ende muss nach dem Beginn liegen." },
      { status: 400 },
    );
  const overlap = await prisma.availabilityRule.findFirst({
    where: {
      userId: user.id,
      weekday: parsed.data.weekday,
      startMinute: { lt: endMinute },
      endMinute: { gt: startMinute },
    },
  });
  if (overlap)
    return NextResponse.json(
      { error: "Für diesen Zeitraum besteht bereits eine Regel." },
      { status: 409 },
    );
  const rule = await prisma.availabilityRule.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      weekday: parsed.data.weekday,
      startMinute,
      endMinute,
      available: parsed.data.available,
    },
  });
  return NextResponse.json({ rule }, { status: 201 });
}
