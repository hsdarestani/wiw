import { CalendarDays, Clock3, Users, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const manager = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const [todayShifts, teamSize, pendingTimeOff, pendingTrades, activeTeam, upcoming] = await Promise.all([
    prisma.shift.count({ where: { organizationId: user.organizationId, startsAt: { gte: start, lt: end }, status: { in: ["PUBLISHED", "OPEN"] } } }),
    prisma.user.count({ where: { organizationId: user.organizationId } }),
    manager ? prisma.timeOffRequest.count({ where: { organizationId: user.organizationId, status: "PENDING" } }) : Promise.resolve(0),
    manager ? prisma.shiftTrade.count({ where: { organizationId: user.organizationId, status: "PENDING" } }) : Promise.resolve(0),
    prisma.timeEntry.findMany({ where: { organizationId: user.organizationId, clockOut: null }, include: { user: true }, orderBy: { clockIn: "asc" }, take: 8 }),
    prisma.shift.findMany({ where: { organizationId: user.organizationId, startsAt: { gte: new Date() }, status: { in: ["PUBLISHED", "OPEN"] }, ...(manager ? {} : { assigneeId: user.id }) }, include: { assignee: true, location: true, position: true }, orderBy: { startsAt: "asc" }, take: 8 }),
  ]);
  const cards = [
    [CalendarDays, "Heutige Schichten", todayShifts, "/schedule"],
    [Clock3, "Jetzt im Dienst", activeTeam.length, "/time-clock"],
    [Users, "Teammitglieder", teamSize, "/employees"],
    [ClipboardCheck, "Offene Anfragen", pendingTimeOff + pendingTrades, "/time-off"],
  ] as const;
  return <div className="content">
    <div className="page-heading"><div><h1>Guten Tag, {user.firstName}</h1><p>{user.organization.name} auf einen Blick.</p></div><Link className="btn primary" href="/schedule">Dienstplan öffnen</Link></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 18 }}>
      {cards.map(([Icon, label, value, href]) => <Link href={href} key={label} className="panel" style={{ padding: 18, textDecoration: "none", color: "inherit" }}><Icon size={21} color="#087f73" /><span style={{ display: "block", color: "#697986", fontSize: 12, marginTop: 15 }}>{label}</span><strong style={{ display: "block", fontSize: 28, marginTop: 5 }}>{value}</strong></Link>)}
    </div>
    <div className="trade-columns">
      <section className="panel"><div className="panel-head"><h2>Nächste Schichten</h2><Link href="/schedule">Alle anzeigen</Link></div>{upcoming.length === 0 ? <div className="empty">Keine bevorstehenden Schichten.</div> : upcoming.map((shift) => <div className="clock-row" key={shift.id}><div><strong>{shift.position.name}</strong><small>{shift.assignee ? `${shift.assignee.firstName} ${shift.assignee.lastName}` : "OpenShift"} · {shift.location.name}</small></div><span>{shift.startsAt.toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div>)}</section>
      <section className="panel"><div className="panel-head"><h2>Jetzt im Dienst</h2><Link href="/time-clock">Zeiterfassung</Link></div>{activeTeam.length === 0 ? <div className="empty">Derzeit ist niemand eingestempelt.</div> : activeTeam.map((entry) => <div className="clock-row" key={entry.id}><div><strong>{entry.user.firstName} {entry.user.lastName}</strong><small>Seit {entry.clockIn.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</small></div><span>Aktiv</span></div>)}</section>
    </div>
  </div>;
}
