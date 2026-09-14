import {
  Bell,
  CalendarDays,
  CalendarOff,
  CalendarClock,
  ArrowLeftRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const links = [
  [LayoutDashboard, "Übersicht", "#"],
  [CalendarDays, "Dienstplan", "/schedule"],
  [Clock3, "Zeiterfassung", "/time-clock"],
  [Users, "Mitarbeiter", "/employees"],
  [CalendarOff, "Abwesenheiten", "/time-off"],
  [CalendarClock, "Verfügbarkeit", "/availability"],
  [ArrowLeftRight, "Schichttausch", "/shift-trades"],
  [MessageSquare, "Nachrichten", "/messages"],
  [WalletCards, "Lohnabrechnung", "/reports"],
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const initials =
    `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>SchichtPro
        </div>
        <nav className="nav">
          <div className="nav-section">{user.organization.name}</div>
          {links.map(([Icon, label, href]) => (
            <Link key={label} className="nav-item" href={href}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <div className="nav-section">Verwaltung</div>
          <Link className="nav-item" href="/settings/workplaces">
            <Store size={18} />
            Standorte
          </Link>
          <Link className="nav-item" href="#">
            <Settings size={18} />
            Einstellungen
          </Link>
        </nav>
        <div className="account">
          <span className="avatar">{initials}</span>
          <div>
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <small>{user.role === "OWNER" ? "Inhaber" : user.role}</small>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="icon-button" aria-label="Abmelden">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Menü">
            <Menu size={20} />
          </button>
          <span className="topbar-title">SchichtPro</span>
          <div className="topbar-right">
            <button className="icon-button" aria-label="Benachrichtigungen">
              <Bell size={20} />
            </button>
            <button className="btn">Hilfe</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
