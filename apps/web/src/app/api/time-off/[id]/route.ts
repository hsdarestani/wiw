import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["APPROVED", "DECLINED", "CANCELLED"]),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  const { id } = await params;
  const item = await prisma.timeOffRequest.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!item)
    return NextResponse.json(
      { error: "Anfrage nicht gefunden." },
      { status: 404 },
    );
  const manager = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  if (parsed.data.status === "CANCELLED") {
    if (item.userId !== user.id || item.status !== "PENDING")
      return NextResponse.json(
        { error: "Diese Anfrage kann nicht storniert werden." },
        { status: 403 },
      );
  } else if (!manager || item.status !== "PENDING")
    return NextResponse.json(
      { error: "Diese Anfrage kann nicht bearbeitet werden." },
      { status: 403 },
    );
  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedById: parsed.data.status === "CANCELLED" ? null : user.id,
      reviewedAt: parsed.data.status === "CANCELLED" ? null : new Date(),
    },
  });
  return NextResponse.json({ request: updated });
}
