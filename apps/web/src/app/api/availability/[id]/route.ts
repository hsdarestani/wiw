import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const { id } = await params;
  const result = await prisma.availabilityRule.deleteMany({
    where: { id, userId: user.id, organizationId: user.organizationId },
  });
  if (!result.count)
    return NextResponse.json(
      { error: "Regel nicht gefunden." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
