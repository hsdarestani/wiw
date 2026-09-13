import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
