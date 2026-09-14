import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const parseDate = (value: string | null, fallback: Date) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
};
const csv = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  const url = new URL(request.url);
  const today = new Date();
  const from = parseDate(
    url.searchParams.get("from"),
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
  );
  const to = parseDate(url.searchParams.get("to"), today);
  const until = new Date(to);
  until.setUTCDate(until.getUTCDate() + 1);
  const rawStatus = url.searchParams.get("status") ?? "APPROVED";
  const status = ["ALL", "PENDING", "APPROVED", "DECLINED"].includes(rawStatus)
    ? rawStatus
    : "APPROVED";
  const entries = await prisma.timeEntry.findMany({
    where: {
      organizationId: user.organizationId,
      clockOut: { not: null },
      clockIn: { gte: from, lt: until },
      ...(status === "ALL"
        ? {}
        : { approvalStatus: status as "PENDING" | "APPROVED" | "DECLINED" }),
    },
    include: { user: true, location: true },
    orderBy: { clockIn: "asc" },
  });
  const lines = [
    [
      "Mitarbeiter",
      "Datum",
      "Beginn",
      "Ende",
      "Pause (Min.)",
      "Arbeitszeit (Std.)",
      "Stundensatz (EUR)",
      "Lohnkosten (EUR)",
      "Status",
      "Standort",
    ]
      .map(csv)
      .join(";"),
    ...entries.map((entry) => {
      const minutes = Math.max(
        0,
        Math.round(
          (entry.clockOut!.getTime() - entry.clockIn.getTime()) / 60000 -
            entry.breakMinutes,
        ),
      );
      const rate = Number(entry.user.hourlyRate);
      return [
        `${entry.user.firstName} ${entry.user.lastName}`,
        entry.clockIn.toLocaleDateString("de-DE", { timeZone: "UTC" }),
        entry.clockIn.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }),
        entry.clockOut!.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }),
        entry.breakMinutes,
        (minutes / 60).toFixed(2).replace(".", ","),
        rate.toFixed(2).replace(".", ","),
        ((minutes / 60) * rate).toFixed(2).replace(".", ","),
        entry.approvalStatus,
        entry.location?.name ?? "",
      ]
        .map(csv)
        .join(";");
    }),
  ];
  const filename = `schichtpro-lohn-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`;
  return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
