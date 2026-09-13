import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Ungültiger Zeitraum." },
      { status: 400 },
    );
  const result = await prisma.shift.updateMany({
    where: {
      organizationId: user.organizationId,
      status: "DRAFT",
      startsAt: {
        gte: new Date(parsed.data.startsAt),
        lt: new Date(parsed.data.endsAt),
      },
    },
    data: { status: "PUBLISHED" },
  });
  return NextResponse.json({ published: result.count });
}
