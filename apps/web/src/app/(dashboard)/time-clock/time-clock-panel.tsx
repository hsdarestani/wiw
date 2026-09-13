"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Entry = {
  id: string;
  clockIn: string;
  clockOut: string | null;
  source: string;
  location: string | null;
  breakStartedAt: string | null;
  breakMinutes: number;
  approvalStatus: string;
  correctionNote: string | null;
};
type Active = {
  id: string;
  name: string;
  clockIn: string;
  location: string | null;
  breakStartedAt: string | null;
};
const duration = (
  start: string,
  end: string | null,
  now = Date.now(),
  breakMinutes = 0,
) => {
  const ms =
    (end ? new Date(end).getTime() : now) -
    new Date(start).getTime() -
    breakMinutes * 60000;
  const total = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function TimeClockPanel({
  entries,
  activeTeam,
  pendingEntries,
  auditLogs,
}: {
  entries: Entry[];
  activeTeam: Active[];
  pendingEntries: Array<Entry & { userName: string }>;
  auditLogs: Array<{
    id: string;
    actorName: string;
    action: string;
    reason: string;
    createdAt: string;
  }>;
}) {
  const router = useRouter();
  const active = entries.find((item) => !item.clockOut);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const total = useMemo(
    () =>
      entries.reduce(
        (sum, item) =>
          sum +
          (item.clockOut
            ? new Date(item.clockOut).getTime() -
              new Date(item.clockIn).getTime() -
              item.breakMinutes * 60000
            : 0),
        0,
      ) / 3600000,
    [entries],
  );
  async function toggle(action?: "TOGGLE_BREAK") {
    setBusy(true);
    setError("");
    const response = await fetch("/api/time-clock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: action ?? (active ? "CLOCK_OUT" : "CLOCK_IN"),
      }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setError(body.error);
    router.refresh();
  }
  async function review(id: string, status: "APPROVED" | "DECLINED") {
    setError("");
    const response = await fetch(`/api/timesheets/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "REVIEW", status }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    router.refresh();
  }
  async function edit(item: Entry) {
    const clockIn = window.prompt("Beginn (ISO-Zeit)", item.clockIn);
    const clockOut = window.prompt("Ende (ISO-Zeit)", item.clockOut ?? "");
    const breakValue = window.prompt(
      "Pause in Minuten",
      String(item.breakMinutes),
    );
    const reason = window.prompt(
      "Grund der Korrektur (Pflichtfeld)",
      item.correctionNote ?? "",
    );
    if (!clockIn || !clockOut || breakValue === null || !reason) return;
    const response = await fetch(`/api/timesheets/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "EDIT",
        clockIn: new Date(clockIn).toISOString(),
        clockOut: new Date(clockOut).toISOString(),
        breakMinutes: Number(breakValue),
        reason,
      }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    router.refresh();
  }
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>Zeiterfassung</h1>
          <p>Arbeitszeit starten, beenden und im Blick behalten.</p>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="clock-grid">
        <section className={`clock-card ${active ? "running" : ""}`}>
          <span className="clock-kicker">
            {active ? "ARBEITSZEIT LÄUFT" : "BEREIT ZUM START"}
          </span>
          <strong className="clock-time">
            {active
              ? duration(active.clockIn, null, now)
              : new Date(now).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
          </strong>
          <p>
            {active
              ? `Gestartet um ${new Date(active.clockIn).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
              : "Du bist derzeit nicht eingestempelt."}
          </p>
          <button
            className={`clock-button ${active ? "stop" : ""}`}
            disabled={busy}
            onClick={() => toggle()}
          >
            {busy ? "Bitte warten …" : active ? "Ausstempeln" : "Einstempeln"}
          </button>
          {active && (
            <button
              className="break-button"
              disabled={busy}
              onClick={() => toggle("TOGGLE_BREAK")}
            >
              {active.breakStartedAt ? "Pause beenden" : "Pause starten"}
            </button>
          )}
        </section>
        <section className="panel clock-summary">
          <div>
            <span>LETZTE 30 TAGE</span>
            <strong>{total.toFixed(1)} Std.</strong>
          </div>
          <div>
            <span>ABGESCHLOSSENE EINTRÄGE</span>
            <strong>{entries.filter((item) => item.clockOut).length}</strong>
          </div>
        </section>
      </div>
      {activeTeam.length > 0 && (
        <section className="panel clock-team">
          <div className="panel-head">
            <h2>Jetzt im Dienst</h2>
            <span>{activeTeam.length} aktiv</span>
          </div>
          {activeTeam.map((item) => (
            <div className="clock-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <small>{item.location ?? "Kein Standort"}</small>
              </div>
              <span>
                {item.breakStartedAt
                  ? "In Pause"
                  : `${duration(item.clockIn, null, now)} Std.`}
              </span>
            </div>
          ))}
        </section>
      )}
      <section className="panel">
        <div className="panel-head">
          <h2>Meine Zeiteinträge</h2>
        </div>
        {!entries.length ? (
          <div className="empty">Noch keine Arbeitszeit erfasst.</div>
        ) : (
          entries.map((item) => (
            <div className="clock-row" key={item.id}>
              <div>
                <strong>
                  {new Date(item.clockIn).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </strong>
                <small>
                  {new Date(item.clockIn).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {item.clockOut
                    ? new Date(item.clockOut).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "läuft"}{" "}
                  · {item.source}
                </small>
              </div>
              <span>
                {duration(item.clockIn, item.clockOut, now, item.breakMinutes)}{" "}
                · {item.breakMinutes} Min. Pause · {item.approvalStatus}
              </span>
            </div>
          ))
        )}
      </section>
      {pendingEntries.length > 0 && (
        <section className="panel timesheet-review">
          <div className="panel-head">
            <h2>Zeiten zur Freigabe</h2>
            <span>{pendingEntries.length} offen</span>
          </div>
          {pendingEntries.map((item) => (
            <div className="clock-row" key={item.id}>
              <div>
                <strong>{item.userName}</strong>
                <small>
                  {new Date(item.clockIn).toLocaleString("de-DE")} ·{" "}
                  {item.breakMinutes} Min. Pause
                  {item.correctionNote
                    ? ` · Korrektur: ${item.correctionNote}`
                    : ""}
                </small>
              </div>
              <div className="request-actions">
                <button className="btn" onClick={() => edit(item)}>
                  Bearbeiten
                </button>
                <button
                  className="btn approve"
                  onClick={() => review(item.id, "APPROVED")}
                >
                  Genehmigen
                </button>
                <button
                  className="btn"
                  onClick={() => review(item.id, "DECLINED")}
                >
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {auditLogs.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Änderungsprotokoll</h2>
            <span>unveränderbar dokumentiert</span>
          </div>
          {auditLogs.map((item) => (
            <div className="clock-row" key={item.id}>
              <div>
                <strong>
                  {item.action === "EDIT"
                    ? "Zeiteintrag korrigiert"
                    : item.action === "REQUEST_CORRECTION"
                      ? "Korrektur angefragt"
                      : "Zeiteintrag geprüft"}
                </strong>
                <small>
                  {item.actorName} · {item.reason}
                </small>
              </div>
              <span>{new Date(item.createdAt).toLocaleString("de-DE")}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
