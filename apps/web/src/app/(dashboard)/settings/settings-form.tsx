"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UserData = { firstName: string; lastName: string; email: string; role: string; hourlyRate: number; organization: string; industry: string };
export function SettingsForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const canEditOrganization = ["OWNER", "ADMIN"].includes(user.role);
  async function submit(event: FormEvent<HTMLFormElement>, action: "PROFILE" | "ORGANIZATION") {
    event.preventDefault(); setBusy(action); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    const payload = action === "PROFILE"
      ? { action, firstName: form.get("firstName"), lastName: form.get("lastName"), hourlyRate: form.get("hourlyRate") }
      : { action, name: form.get("name"), industry: form.get("industry") };
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json(); setBusy("");
    if (!response.ok) return setError(body.error);
    setMessage("Änderungen gespeichert."); router.refresh();
  }
  return <div className="content"><div className="page-heading"><div><h1>Einstellungen</h1><p>Konto und Unternehmen verwalten.</p></div></div>
    {error && <div className="auth-error">{error}</div>}{message && <div className="invite-code"><strong style={{ fontSize: 14 }}>{message}</strong></div>}
    <div className="team-grid">
      <form className="invite-form" onSubmit={(event) => submit(event, "PROFILE")}><div><h2>Mein Profil</h2><p>{user.email} · {user.role}</p></div><div className="form-row"><label>Vorname<input required name="firstName" defaultValue={user.firstName} /></label><label>Nachname<input name="lastName" defaultValue={user.lastName} /></label><label>Stundensatz (€)<input name="hourlyRate" type="number" min="0" step="0.01" defaultValue={user.hourlyRate} /></label><button className="btn primary" disabled={busy === "PROFILE"}>{busy === "PROFILE" ? "Speichern …" : "Profil speichern"}</button></div></form>
      <form className="invite-form" onSubmit={(event) => submit(event, "ORGANIZATION")}><div><h2>Unternehmen</h2><p>Diese Angaben gelten für das gesamte Team.</p></div><fieldset disabled={!canEditOrganization || busy === "ORGANIZATION"} style={{ border: 0, padding: 0, margin: 0 }}><div className="form-row"><label>Unternehmensname<input required name="name" defaultValue={user.organization} /></label><label>Branche<input name="industry" defaultValue={user.industry} /></label><button className="btn primary">{busy === "ORGANIZATION" ? "Speichern …" : "Unternehmen speichern"}</button></div></fieldset>{!canEditOrganization && <p style={{ color: "#697986", fontSize: 12 }}>Nur Inhaber und Administratoren können Unternehmensdaten ändern.</p>}</form>
    </div>
  </div>;
}
