import { Download, Euro, Timer, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dateValue = (value: string | undefined, fallback: Date) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
};
const inputDate = (date: Date) => date.toISOString().slice(0, 10);
const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    redirect("/time-clock");
  const query = await searchParams;
  const today = new Date();
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const from = dateValue(query.from, monthStart);
  const to = dateValue(query.to, today);
  const until = new Date(to);
  until.setUTCDate(until.getUTCDate() + 1);
  const status = ["ALL", "PENDING", "APPROVED", "DECLINED"].includes(
    query.status ?? "",
  )
    ? query.status!
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
    orderBy: [{ user: { lastName: "asc" } }, { clockIn: "asc" }],
  });
  const rows = new Map<
    string,
    { id: string; name: string; rate: number; minutes: number; entries: number }
  >();
  for (const entry of entries) {
    const minutes = Math.max(
      0,
      Math.round(
        (entry.clockOut!.getTime() - entry.clockIn.getTime()) / 60000 -
          entry.breakMinutes,
      ),
    );
    const current = rows.get(entry.userId) ?? {
      id: entry.userId,
      name: `${entry.user.firstName} ${entry.user.lastName}`,
      rate: Number(entry.user.hourlyRate),
      minutes: 0,
      entries: 0,
    };
    current.minutes += minutes;
    current.entries += 1;
    rows.set(entry.userId, current);
  }
  const people = [...rows.values()];
  const totalMinutes = people.reduce((sum, item) => sum + item.minutes, 0);
  const totalPayroll = people.reduce(
    (sum, item) => sum + (item.minutes / 60) * item.rate,
    0,
  );
  const params = new URLSearchParams({
    from: inputDate(from),
    to: inputDate(to),
    status,
  });
  return (
    <div className="content reports-page">
      <div className="page-heading reports-heading">
        <div>
          <h1>Lohnabrechnung</h1>
          <p>
            Arbeitszeiten prüfen, Lohnkosten berechnen und Daten exportieren.
          </p>
        </div>
        <a className="btn primary" href={`/api/reports/payroll.csv?${params}`}>
          <Download size={16} /> CSV exportieren
        </a>
      </div>
      <form className="panel report-filters" method="get">
        <label>
          Von
          <input type="date" name="from" defaultValue={inputDate(from)} />
        </label>
        <label>
          Bis
          <input type="date" name="to" defaultValue={inputDate(to)} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="APPROVED">Genehmigt</option>
            <option value="PENDING">Offen</option>
            <option value="DECLINED">Abgelehnt</option>
            <option value="ALL">Alle</option>
          </select>
        </label>
        <button className="btn" type="submit">
          Anwenden
        </button>
      </form>
      <div className="report-cards">
        <div className="report-card">
          <Timer size={20} />
          <span>Gesamtstunden</span>
          <strong>{(totalMinutes / 60).toFixed(2)}</strong>
        </div>
        <div className="report-card">
          <Euro size={20} />
          <span>Lohnkosten</span>
          <strong>{money.format(totalPayroll)}</strong>
        </div>
        <div className="report-card">
          <Users size={20} />
          <span>Mitarbeiter</span>
          <strong>{people.length}</strong>
        </div>
      </div>
      <section className="panel report-table-wrap">
        <div className="panel-head">
          <h2>Abrechnungsübersicht</h2>
          <span>{entries.length} Zeiteinträge</span>
        </div>
        {people.length === 0 ? (
          <div className="empty">
            Für diesen Zeitraum wurden keine Zeiten gefunden.
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Mitarbeiter</th>
                <th>Einträge</th>
                <th>Arbeitszeit</th>
                <th>Stundensatz</th>
                <th>Lohnkosten</th>
              </tr>
            </thead>
            <tbody>
              {people.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.entries}</td>
                  <td>{(item.minutes / 60).toFixed(2)} Std.</td>
                  <td>{money.format(item.rate)}</td>
                  <td>
                    <strong>
                      {money.format((item.minutes / 60) * item.rate)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Gesamt</td>
                <td>{entries.length}</td>
                <td>{(totalMinutes / 60).toFixed(2)} Std.</td>
                <td>–</td>
                <td>{money.format(totalPayroll)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
      <p className="report-note">
        Berechnung: erfasste Zeit abzüglich unbezahlter Pausen × hinterlegter
        Stundensatz.
      </p>
    </div>
  );
}
