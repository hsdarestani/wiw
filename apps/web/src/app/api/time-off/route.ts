import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  requestType: z.enum(["VACATION", "SICK", "UNPAID", "OTHER"]),
  note: z.string().trim().max(500).optional(),
});
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe die Angaben." },
      { status: 400 },
    );
  const startsOn = new Date(`${parsed.data.startsOn}T00:00:00Z`),
    endsOn = new Date(`${parsed.data.endsOn}T00:00:00Z`);
  if (endsOn < startsOn)
    return NextResponse.json(
      { error: "Das Enddatum muss am oder nach dem Startdatum liegen." },
      { status: 400 },
    );
  const overlap = await prisma.timeOffRequest.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PENDING", "APPROVED"] },
      startsOn: { lte: endsOn },
      endsOn: { gte: startsOn },
    },
  });
  if (overlap)
    return NextResponse.json(
      { error: "Für diesen Zeitraum besteht bereits eine Anfrage." },
      { status: 409 },
    );
  const item = await prisma.timeOffRequest.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      startsOn,
      endsOn,
      requestType: parsed.data.requestType,
      note: parsed.data.note || null,
    },
  });
  return NextResponse.json({ request: item }, { status: 201 });
}
