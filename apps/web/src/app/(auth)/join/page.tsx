"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/auth/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    router.push("/schedule");
    router.refresh();
  }
  return (
    <div className="auth-page">
      <section className="auth-panel">
        <Link href="/" className="auth-brand">
          <span>S</span>SchichtPro
        </Link>
        <div className="auth-form-wrap">
          <h1>Team beitreten</h1>
          <p className="auth-subtitle">
            Nutze den Einladungscode, den du von deinem Arbeitgeber erhalten
            hast.
          </p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Einladungscode</label>
              <input
                name="code"
                autoCapitalize="characters"
                placeholder="AB12CD34EF"
                required
              />
            </div>
            <div className="field">
              <label>Vor- und Nachname</label>
              <input name="name" placeholder="Max Mustermann" required />
            </div>
            <div className="field">
              <label>E-Mail-Adresse</label>
              <input
                name="email"
                type="email"
                placeholder="max@unternehmen.de"
                required
              />
            </div>
            <div className="field">
              <label>Passwort</label>
              <input
                name="password"
                type="password"
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
                required
              />
            </div>
            <button className="auth-submit" disabled={loading}>
              {loading ? "Team wird verbunden …" : "Team beitreten"}
            </button>
          </form>
          <p className="auth-switch">
            Du planst ein Team?{" "}
            <Link href="/signup">Unternehmen registrieren</Link>
          </p>
        </div>
      </section>
      <aside className="auth-visual">
        <div className="visual-content">
          <h2>Dein Dienstplan ist schon bereit.</h2>
          <p>
            Nach dem Beitritt siehst du deine Schichten, Team-Updates und
            offenen Dienste an einem Ort.
          </p>
        </div>
      </aside>
    </div>
  );
}
