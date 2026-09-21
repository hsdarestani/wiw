import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().trim().regex(/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/).max(255),
  platform: z.enum(["ios", "android"]),
});

export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiges Gerät." }, { status: 400 });
  await prisma.pushDevice.upsert({
    where: { token: parsed.data.token },
    update: { userId: user.id, platform: parsed.data.platform, enabled: true },
    create: { userId: user.id, token: parsed.data.token, platform: parsed.data.platform },
  });
  return NextResponse.json({ registered: true });
}

export async function DELETE(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = z.object({ token: z.string().min(1).max(255) }).safeParse(await request.json().catch(() => null));
  if (parsed.success) await prisma.pushDevice.deleteMany({ where: { userId: user.id, token: parsed.data.token } });
  return NextResponse.json({ removed: true });
}
