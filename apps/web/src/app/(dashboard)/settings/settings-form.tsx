"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserData = { firstName: string; lastName: string; email: string; role: string; hourlyRate: number; organization: string; industry: string };
export function SettingsForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const canEditOrganization = ["OWNER", "ADMIN"].includes(user.role);
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("PASSWORD"); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) { setBusy(""); return setError("Die neuen Passwörter stimmen nicht überein."); }
    const response = await fetch("/api/settings/password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }) });
    const body = await response.json(); setBusy("");
    if (!response.ok) return setError(body.error);
    window.location.href = "/login";
  }
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
      <div className="invite-form"><div><h2>Aufgabenlisten</h2><p>Checklisten für wiederkehrende Schichtaufgaben erstellen.</p></div><Link className="btn" href="/settings/task-lists">Aufgabenlisten verwalten</Link></div>
      <form className="invite-form" onSubmit={(event) => submit(event, "PROFILE")}><div><h2>Mein Profil</h2><p>{user.email} · {user.role}</p></div><div className="form-row"><label>Vorname<input required name="firstName" defaultValue={user.firstName} /></label><label>Nachname<input name="lastName" defaultValue={user.lastName} /></label><label>Stundensatz (€)<input name="hourlyRate" type="number" min="0" step="0.01" defaultValue={user.hourlyRate} /></label><button className="btn primary" disabled={busy === "PROFILE"}>{busy === "PROFILE" ? "Speichern …" : "Profil speichern"}</button></div></form>
      <form className="invite-form" onSubmit={(event) => submit(event, "ORGANIZATION")}><div><h2>Unternehmen</h2><p>Diese Angaben gelten für das gesamte Team.</p></div><fieldset disabled={!canEditOrganization || busy === "ORGANIZATION"} style={{ border: 0, padding: 0, margin: 0 }}><div className="form-row"><label>Unternehmensname<input required name="name" defaultValue={user.organization} /></label><label>Branche<input name="industry" defaultValue={user.industry} /></label><button className="btn primary">{busy === "ORGANIZATION" ? "Speichern …" : "Unternehmen speichern"}</button></div></fieldset>{!canEditOrganization && <p style={{ color: "#697986", fontSize: 12 }}>Nur Inhaber und Administratoren können Unternehmensdaten ändern.</p>}</form>
    </div>
    <form className="invite-form" style={{ marginTop: 18, maxWidth: 600 }} onSubmit={changePassword}><div><h2>Passwort ändern</h2><p>Nach der Änderung wirst du auf allen Geräten abgemeldet.</p></div><div className="form-row"><label>Aktuelles Passwort<input required name="currentPassword" type="password" autoComplete="current-password" minLength={8} /></label><label>Neues Passwort<input required name="newPassword" type="password" autoComplete="new-password" minLength={10} /></label><label>Neues Passwort bestätigen<input required name="confirmPassword" type="password" autoComplete="new-password" minLength={10} /></label><button className="btn primary" disabled={busy === "PASSWORD"}>{busy === "PASSWORD" ? "Wird geändert …" : "Passwort ändern"}</button></div></form>
  </div>;
}
