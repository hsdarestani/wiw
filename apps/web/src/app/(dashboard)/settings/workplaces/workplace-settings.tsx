"use client";
import { FormEvent, useState } from "react";
import { MapPin, BriefcaseBusiness, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Location = { id: string; name: string; usage: number; latitude: number | null; longitude: number | null; geofenceRadius: number };
type Position = { id: string; name: string; color: string; usage: number };

export function WorkplaceSettings({ locations, positions }: { locations: Location[]; positions: Position[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  async function create(event: FormEvent<HTMLFormElement>, type: "locations" | "positions") {
    event.preventDefault();
    setBusy(type); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/${type}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), ...(type === "positions" ? { color: form.get("color") } : {}) }),
    });
    const body = await response.json();
    setBusy("");
    if (!response.ok) return setError(body.error);
    event.currentTarget.reset();
    router.refresh();
  }
  async function remove(type: "locations" | "positions", id: string) {
    if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;
    setBusy(id); setError("");
    const response = await fetch(`/api/${type}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    const body = await response.json();
    setBusy("");
    if (!response.ok) return setError(body.error);
    router.refresh();
  }
  async function saveGeofence(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setBusy(`geo-${id}`); setError(""); const form = new FormData(event.currentTarget);
    const enabled = form.get("enabled") === "on";
    const response = await fetch("/api/locations", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, latitude: enabled ? Number(form.get("latitude")) : null, longitude: enabled ? Number(form.get("longitude")) : null, geofenceRadius: Number(form.get("geofenceRadius") || 150) }) });
    const body = await response.json(); setBusy(""); if (!response.ok) return setError(body.error); router.refresh();
  }
  return <div className="content">
    <div className="page-heading"><div><h1>Standorte & Positionen</h1><p>Arbeitsorte und Rollen für den Dienstplan verwalten.</p></div></div>
    {error && <div className="auth-error">{error}</div>}
    <div className="team-grid">
      <section className="panel"><div className="panel-head"><h2><MapPin size={17} /> Standorte</h2><span>{locations.length} aktiv</span></div>
        {locations.length === 0 ? <div className="empty">Noch kein Standort vorhanden.</div> : locations.map((item) => <div className="location-settings" key={item.id}><div className="member-row"><strong>{item.name}</strong><span>{item.usage} Verknüpfungen</span><span className={item.latitude !== null ? "status-active" : "status-pending"}>{item.latitude !== null ? "Geofence aktiv" : "Ohne Geofence"}</span><button className="icon-button" disabled={busy === item.id || item.usage > 0} title={item.usage > 0 ? "Wird im Dienstplan verwendet" : "Löschen"} onClick={() => remove("locations", item.id)}><Trash2 size={16} /></button></div><form className="geofence-form" onSubmit={(event) => saveGeofence(event, item.id)}><label className="geofence-toggle"><input type="checkbox" name="enabled" defaultChecked={item.latitude !== null} /> GPS-Bereich erzwingen</label><input name="latitude" type="number" step="any" defaultValue={item.latitude ?? ""} placeholder="Breitengrad" /><input name="longitude" type="number" step="any" defaultValue={item.longitude ?? ""} placeholder="Längengrad" /><input name="geofenceRadius" type="number" min="50" max="5000" defaultValue={item.geofenceRadius} aria-label="Radius in Metern" /><button className="btn" disabled={busy === `geo-${item.id}`}>{busy === `geo-${item.id}` ? "…" : "GPS speichern"}</button></form></div>)}
        <form className="invite-form" onSubmit={(event) => create(event, "locations")}><div><h2>Standort hinzufügen</h2><p>Name des Arbeitsortes oder der Filiale.</p></div><div className="form-row"><label>Name<input required name="name" maxLength={100} placeholder="z. B. Frankfurt Zentrum" /></label><button className="btn primary" disabled={busy === "locations"}>{busy === "locations" ? "Speichern …" : "Hinzufügen"}</button></div></form>
      </section>
      <section className="panel"><div className="panel-head"><h2><BriefcaseBusiness size={17} /> Positionen</h2><span>{positions.length} aktiv</span></div>
        {positions.length === 0 ? <div className="empty">Noch keine Position vorhanden.</div> : positions.map((item) => <div className="member-row" key={item.id}><span style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} /><strong>{item.name}</strong><span>{item.usage} Schichten</span><button className="icon-button" disabled={busy === item.id || item.usage > 0} title={item.usage > 0 ? "Wird im Dienstplan verwendet" : "Löschen"} onClick={() => remove("positions", item.id)}><Trash2 size={16} /></button></div>)}
        <form className="invite-form" onSubmit={(event) => create(event, "positions")}><div><h2>Position hinzufügen</h2><p>Rolle und Farbe im Dienstplan.</p></div><div className="form-row"><label>Name<input required name="name" maxLength={100} placeholder="z. B. Service" /></label><label>Farbe<input name="color" type="color" defaultValue="#168b7e" /></label><button className="btn primary" disabled={busy === "positions"}>{busy === "positions" ? "Speichern …" : "Hinzufügen"}</button></div></form>
      </section>
    </div>
  </div>;
}
