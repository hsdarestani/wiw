import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ content: z.string().trim().min(1).max(2000) });
export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte gib eine Nachricht ein." },
      { status: 400 },
    );
  await prisma.message.create({
    data: {
      organizationId: user.organizationId,
      authorId: user.id,
      content: parsed.data.content,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
