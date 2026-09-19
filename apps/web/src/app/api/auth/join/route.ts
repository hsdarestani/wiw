import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().trim().min(6).max(30),
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Bitte prüfe deine Eingaben." },
      { status: 400 },
    );
  const email = parsed.data.email.trim().toLowerCase();
  const invitation = await prisma.invitation.findUnique({
    where: { code: parsed.data.code.toUpperCase() },
  });
  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date()
  )
    return NextResponse.json(
      { error: "Der Einladungscode ist ungültig oder abgelaufen." },
      { status: 400 },
    );
  if (invitation.email && invitation.email !== email)
    return NextResponse.json(
      {
        error: "Diese Einladung wurde für eine andere E-Mail-Adresse erstellt.",
      },
      { status: 403 },
    );
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } }))
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 },
    );
  const [firstName, ...rest] = parsed.data.name.split(/\s+/);
  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("INVITATION_CLAIMED");
    const joinedUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName: rest.join(" "),
        role: invitation.role,
        organizationId: invitation.organizationId,
      },
    });
    const teamConversation = await tx.conversation.findFirst({
      where: {
        organizationId: invitation.organizationId,
        isGroup: true,
        name: "Team-Chat",
      },
      select: { id: true },
    });
    if (teamConversation) {
      await tx.conversationParticipant.create({
        data: { conversationId: teamConversation.id, userId: joinedUser.id },
      });
    }
    return joinedUser;
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
