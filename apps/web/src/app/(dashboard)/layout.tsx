import {
  Bell,
  CalendarDays,
  ArrowLeftRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
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
  [MessageSquare, "Nachrichten", "/messages"],
  [WalletCards, "Berichte", "/reports"],
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
          <span className="brand-mark">S</span><span className="brand-name">SchichtPro</span>
        </div>
        <nav className="nav">
          {links.map(([Icon, label, href]) => (
            <Link key={label} className="nav-item" href={href}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="top-actions">
          <Link className="top-action" href="/shift-trades"><ArrowLeftRight size={17} /><span>Anfragen</span></Link>
          <Link className="top-action" href="/employees"><Users size={17} /><span>Arbeitsplatz</span></Link>
          <Link className="top-action" href="/settings"><Settings size={18} /><span>Einstellungen</span></Link>
          <Link className="top-action notification-action" href="/notifications" aria-label="Benachrichtigungen">
            <Bell size={19} />
            {unreadNotifications > 0 && <span className="notification-count">{Math.min(unreadNotifications, 99)}</span>}
          </Link>
        </div>
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
        {children}
      </main>
    </div>
  );
}
