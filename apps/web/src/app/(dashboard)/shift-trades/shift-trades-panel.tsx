"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Shift = {
  id: string;
  startsAt: string;
  endsAt: string;
  position: string;
  color: string;
  location: string;
};
type Trade = {
  id: string;
  kind: string;
  status: string;
  owner: string | null;
  claimant: string | null;
  reviewer: string | null;
  shift: Shift;
};
const status: Record<string, string> = {
  OFFERED: "Angeboten",
  PENDING: "Wartet auf Freigabe",
  APPROVED: "Genehmigt",
  DECLINED: "Abgelehnt",
  CANCELLED: "Storniert",
};
const when = (shift: Shift) =>
  `${new Date(shift.startsAt).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}, ${new Date(shift.startsAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–${new Date(shift.endsAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;

export function ShiftTradesPanel({
  manager,
  myShifts,
  openShifts,
  offers,
  trades,
}: {
  manager: boolean;
  myShifts: Shift[];
  openShifts: Shift[];
  offers: Array<{ id: string; owner: string; shift: Shift }>;
  trades: Trade[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function act(body: Record<string, string>, key: string) {
    setBusy(key);
    setError("");
    const response = await fetch("/api/shift-trades", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setBusy("");
    if (!response.ok) return setError(result.error);
    router.refresh();
  }
  const card = (shift: Shift, action?: React.ReactNode) => (
    <article
      className="trade-shift"
      key={shift.id}
      style={{ borderLeftColor: shift.color }}
    >
      <div>
        <strong>{shift.position}</strong>
        <span>{when(shift)}</span>
        <small>{shift.location}</small>
      </div>
      {action}
    </article>
  );
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>Schichttausch</h1>
          <p>OpenShifts übernehmen und Schichten sicher im Team tauschen.</p>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="trade-columns">
        <section className="panel">
          <div className="panel-head">
            <h2>Verfügbare Schichten</h2>
          </div>
          <div className="trade-list">
            {!openShifts.length && !offers.length && (
              <div className="empty">Derzeit keine verfügbaren Schichten.</div>
            )}
            {openShifts.map((item) =>
              card(
                item,
                <button
                  className="btn primary"
                  disabled={busy === item.id}
                  onClick={() =>
                    act({ action: "CLAIM_OPEN", shiftId: item.id }, item.id)
                  }
                >
                  Anfragen
                </button>,
              ),
            )}
            {offers.map((item) =>
              card(
                item.shift,
                <div>
                  <small>von {item.owner}</small>
                  <button
                    className="btn primary"
                    disabled={busy === item.id}
                    onClick={() =>
                      act({ action: "CLAIM_SWAP", tradeId: item.id }, item.id)
                    }
                  >
                    Übernehmen
                  </button>
                </div>,
              ),
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Meine kommenden Schichten</h2>
          </div>
          <div className="trade-list">
            {!myShifts.length && (
              <div className="empty">Keine kommenden Schichten.</div>
            )}
            {myShifts.map((item) =>
              card(
                item,
                <button
                  className="btn"
                  disabled={busy === item.id}
                  onClick={() =>
                    act({ action: "OFFER_SWAP", shiftId: item.id }, item.id)
                  }
                >
                  Zum Tausch anbieten
                </button>,
              ),
            )}
          </div>
        </section>
      </div>
      <section className="panel trade-requests">
        <div className="panel-head">
          <h2>{manager ? "Freizugebende Anfragen" : "Meine Tauschanfragen"}</h2>
        </div>
        {!trades.length ? (
          <div className="empty">Noch keine Tauschanfragen.</div>
        ) : (
          trades.map((item) => (
            <article className="request-row" key={item.id}>
              <div>
                <strong>
                  {item.kind === "OPEN_SHIFT" ? "OpenShift" : "Schichttausch"} ·{" "}
                  {item.shift.position}
                </strong>
                <span>{when(item.shift)}</span>
                <small>
                  {item.owner && `Abgabe: ${item.owner} · `}
                  {item.claimant
                    ? `Übernahme: ${item.claimant}`
                    : "Noch ohne Interessent"}
                </small>
              </div>
              <span className={`request-status ${item.status.toLowerCase()}`}>
                {status[item.status]}
              </span>
              {manager && item.status === "PENDING" ? (
                <div className="request-actions">
                  <button
                    className="btn approve"
                    onClick={() =>
                      act(
                        {
                          action: "REVIEW",
                          tradeId: item.id,
                          decision: "APPROVED",
                        },
                        item.id,
                      )
                    }
                  >
                    Genehmigen
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      act(
                        {
                          action: "REVIEW",
                          tradeId: item.id,
                          decision: "DECLINED",
                        },
                        item.id,
                      )
                    }
                  >
                    Ablehnen
                  </button>
                </div>
              ) : ["OFFERED", "PENDING"].includes(item.status) ? (
                <button
                  className="btn"
                  onClick={() =>
                    act({ action: "CANCEL", tradeId: item.id }, item.id)
                  }
                >
                  Stornieren
                </button>
              ) : (
                <span className="reviewer">
                  {item.reviewer && `von ${item.reviewer}`}
                </span>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
