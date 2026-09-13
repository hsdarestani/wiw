import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentConflict } from "@/lib/scheduling-policy";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CLAIM_OPEN"), shiftId: z.string() }),
  z.object({ action: z.literal("OFFER_SWAP"), shiftId: z.string() }),
  z.object({ action: z.literal("CLAIM_SWAP"), tradeId: z.string() }),
  z.object({ action: z.literal("CANCEL"), tradeId: z.string() }),
  z.object({
    action: z.literal("REVIEW"),
    tradeId: z.string(),
    decision: z.enum(["APPROVED", "DECLINED"]),
  }),
]);
const managerRoles = new Set(["OWNER", "ADMIN", "MANAGER"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Ungültige Aktion." }, { status: 400 });
  const input = parsed.data;

  if (input.action === "CLAIM_OPEN") {
    const shift = await prisma.shift.findFirst({
      where: {
        id: input.shiftId,
        organizationId: user.organizationId,
        assigneeId: null,
        status: "OPEN",
        startsAt: { gt: new Date() },
      },
    });
    if (!shift)
      return NextResponse.json(
        { error: "Diese Schicht ist nicht mehr verfügbar." },
        { status: 409 },
      );
    const conflict = await assignmentConflict(
      user.id,
      shift.startsAt,
      shift.endsAt,
    );
    if (conflict)
      return NextResponse.json({ error: conflict }, { status: 409 });
    const active = await prisma.shiftTrade.findFirst({
      where: {
        shiftId: shift.id,
        claimantId: user.id,
        status: { in: ["OFFERED", "PENDING"] },
      },
    });
    if (active)
      return NextResponse.json(
        { error: "Du hast diese Schicht bereits angefragt." },
        { status: 409 },
      );
    const trade = await prisma.shiftTrade.create({
      data: {
        organizationId: user.organizationId,
        shiftId: shift.id,
        claimantId: user.id,
        kind: "OPEN_SHIFT",
        status: "PENDING",
      },
    });
    return NextResponse.json({ trade }, { status: 201 });
  }

  if (input.action === "OFFER_SWAP") {
    const shift = await prisma.shift.findFirst({
      where: {
        id: input.shiftId,
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: "PUBLISHED",
        startsAt: { gt: new Date() },
      },
    });
    if (!shift)
      return NextResponse.json(
        { error: "Schicht nicht gefunden." },
        { status: 404 },
      );
    const active = await prisma.shiftTrade.findFirst({
      where: { shiftId: shift.id, status: { in: ["OFFERED", "PENDING"] } },
    });
    if (active)
      return NextResponse.json(
        { error: "Für diese Schicht läuft bereits eine Anfrage." },
        { status: 409 },
      );
    const trade = await prisma.shiftTrade.create({
      data: {
        organizationId: user.organizationId,
        shiftId: shift.id,
        ownerId: user.id,
        kind: "SWAP",
      },
    });
    return NextResponse.json({ trade }, { status: 201 });
  }

  const trade = await prisma.shiftTrade.findFirst({
    where: { id: input.tradeId, organizationId: user.organizationId },
    include: { shift: true },
  });
  if (!trade)
    return NextResponse.json(
      { error: "Anfrage nicht gefunden." },
      { status: 404 },
    );

  if (input.action === "CLAIM_SWAP") {
    if (
      trade.kind !== "SWAP" ||
      trade.status !== "OFFERED" ||
      trade.ownerId === user.id
    )
      return NextResponse.json(
        { error: "Diese Schicht kann nicht übernommen werden." },
        { status: 409 },
      );
    const conflict = await assignmentConflict(
      user.id,
      trade.shift.startsAt,
      trade.shift.endsAt,
    );
    if (conflict)
      return NextResponse.json({ error: conflict }, { status: 409 });
    const updated = await prisma.shiftTrade.update({
      where: { id: trade.id },
      data: { claimantId: user.id, status: "PENDING" },
    });
    return NextResponse.json({ trade: updated });
  }

  if (input.action === "CANCEL") {
    if (
      (trade.ownerId !== user.id && trade.claimantId !== user.id) ||
      !new Set(["OFFERED", "PENDING"]).has(trade.status)
    )
      return NextResponse.json(
        { error: "Diese Anfrage kann nicht storniert werden." },
        { status: 403 },
      );
    const updated = await prisma.shiftTrade.update({
      where: { id: trade.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ trade: updated });
  }

  if (!managerRoles.has(user.role) || trade.status !== "PENDING")
    return NextResponse.json(
      { error: "Diese Anfrage kann nicht bearbeitet werden." },
      { status: 403 },
    );
  if (input.decision === "APPROVED") {
    if (!trade.claimantId)
      return NextResponse.json(
        { error: "Kein Mitarbeiter ausgewählt." },
        { status: 409 },
      );
    const conflict = await assignmentConflict(
      trade.claimantId,
      trade.shift.startsAt,
      trade.shift.endsAt,
      trade.shift.id,
    );
    if (conflict)
      return NextResponse.json({ error: conflict }, { status: 409 });
    const approved = await prisma.$transaction(async (tx) => {
      const current = await tx.shiftTrade.findFirst({
        where: { id: trade.id, status: "PENDING" },
      });
      if (!current) throw new Error("Anfrage wurde bereits bearbeitet.");
      await tx.shift.update({
        where: { id: trade.shiftId },
        data: { assigneeId: trade.claimantId, status: "PUBLISHED" },
      });
      return tx.shiftTrade.update({
        where: { id: trade.id },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });
    });
    return NextResponse.json({ trade: approved });
  }
  const declined = await prisma.shiftTrade.update({
    where: { id: trade.id },
    data: { status: "DECLINED", reviewedById: user.id, reviewedAt: new Date() },
  });
  return NextResponse.json({ trade: declined });
}
