"use client";
import { CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
type Item = { id: string; type: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string };
export function NotificationsPanel({ items }: { items: Item[] }) {
  const router = useRouter();
  async function read(id?: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) });
    router.refresh();
  }
  return <div className="content"><div className="page-heading"><div><h1>Benachrichtigungen</h1><p>Wichtige Neuigkeiten aus deinem Team.</p></div>{items.some((item) => !item.readAt) && <button className="btn" onClick={() => read()}><CheckCheck size={16} /> Alle gelesen</button>}</div><section className="panel">{items.length === 0 ? <div className="empty">Keine Benachrichtigungen vorhanden.</div> : items.map((item) => <div className="clock-row" key={item.id} style={{ background: item.readAt ? "white" : "#f0faf7" }}><div><strong>{item.title}</strong><small>{item.body} · {new Date(item.createdAt).toLocaleString("de-DE")}</small></div><div className="request-actions">{item.href && <Link className="btn" href={item.href} onClick={() => read(item.id)}>Öffnen</Link>}{!item.readAt && <button className="btn approve" onClick={() => read(item.id)}>Gelesen</button>}</div></div>)}</section></div>;
}
