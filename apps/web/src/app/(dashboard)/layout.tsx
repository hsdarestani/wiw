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
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const links = [
  [LayoutDashboard, "Übersicht", "/dashboard"],
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
  const unreadNotifications = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
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
          <Link className="nav-item" href="/settings">
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
            <Link className="icon-button" href="/notifications" aria-label="Benachrichtigungen" style={{ position: "relative" }}>
              <Bell size={20} />
              {unreadNotifications > 0 && <span style={{ position: "absolute", right: 1, top: 0, minWidth: 16, height: 16, borderRadius: 8, background: "#cf3e4f", color: "white", fontSize: 9, display: "grid", placeItems: "center" }}>{Math.min(unreadNotifications, 99)}</span>}
            </Link>
            <button className="btn">Hilfe</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
