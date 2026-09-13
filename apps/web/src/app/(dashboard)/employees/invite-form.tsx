"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm({
  locations,
}: {
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        role: data.get("role"),
        locationId: data.get("locationId") || null,
      }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setCode(body.invitation.code);
    router.refresh();
  }
  return (
    <form className="invite-form" onSubmit={submit}>
      <div>
        <h2>Mitarbeiter einladen</h2>
        <p>Der Einladungscode ist sieben Tage gültig.</p>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {code && (
        <div className="invite-code">
          <span>Einladungscode</span>
          <strong>{code}</strong>
        </div>
      )}
      <div className="form-row">
        <label>
          E-Mail
          <input name="email" type="email" placeholder="mitarbeiter@firma.de" />
        </label>
        <label>
          Rolle
          <select name="role" defaultValue="EMPLOYEE">
            <option value="EMPLOYEE">Mitarbeiter</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </label>
        <label>
          Standort
          <select name="locationId" defaultValue="">
            <option value="">Alle Standorte</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" disabled={loading}>
          {loading ? "Wird erstellt …" : "Einladung erstellen"}
        </button>
      </div>
    </form>
  );
}
