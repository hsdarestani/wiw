import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["APPROVED", "DECLINED"]) });
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  const { id } = await params;
  const result = await prisma.timeEntry.updateMany({
    where: { id, organizationId: user.organizationId, clockOut: { not: null } },
    data: {
      approvalStatus: parsed.data.status,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });
  if (!result.count)
    return NextResponse.json(
      { error: "Zeiteintrag nicht gefunden." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
