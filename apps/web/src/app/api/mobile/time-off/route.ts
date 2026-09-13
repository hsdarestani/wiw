import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE"),
    startsOn: z.string().date(),
    endsOn: z.string().date(),
    requestType: z.enum(["VACATION", "SICK", "UNPAID", "OTHER"]),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal("CANCEL"), id: z.string().min(1) }),
]);
export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe die Angaben." },
      { status: 400 },
    );
  if (parsed.data.action === "CANCEL") {
    const result = await prisma.timeOffRequest.updateMany({
      where: {
        id: parsed.data.id,
        userId: user.id,
        organizationId: user.organizationId,
        status: "PENDING",
      },
      data: { status: "CANCELLED" },
    });
    if (!result.count)
      return NextResponse.json(
        { error: "Anfrage kann nicht storniert werden." },
        { status: 409 },
      );
    return NextResponse.json({ ok: true });
  }
  const startsOn = new Date(`${parsed.data.startsOn}T00:00:00Z`);
  const endsOn = new Date(`${parsed.data.endsOn}T00:00:00Z`);
  if (endsOn < startsOn)
    return NextResponse.json(
      { error: "Das Enddatum muss nach dem Startdatum liegen." },
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
