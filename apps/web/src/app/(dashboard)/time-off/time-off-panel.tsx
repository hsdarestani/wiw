"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RequestItem = {
  id: string;
  userId: string;
  userName: string;
  startsOn: string;
  endsOn: string;
  requestType: string;
  note: string | null;
  status: string;
  reviewer: string | null;
};
const typeName: Record<string, string> = {
  VACATION: "Urlaub",
  SICK: "Krankheit",
  UNPAID: "Unbezahlt",
  OTHER: "Sonstiges",
};
const statusName: Record<string, string> = {
  PENDING: "Offen",
  APPROVED: "Genehmigt",
  DECLINED: "Abgelehnt",
  CANCELLED: "Storniert",
};
export function TimeOffPanel({
  manager,
  currentUserId,
  requests,
}: {
  manager: boolean;
  currentUserId: string;
  requests: RequestItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/time-off", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    (event.currentTarget as HTMLFormElement).reset();
    router.refresh();
  }
  async function update(id: string, status: string) {
    setError("");
    const response = await fetch(`/api/time-off/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    router.refresh();
  }
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>Abwesenheiten</h1>
          <p>Urlaub und andere Abwesenheiten anfragen und verwalten.</p>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="request-layout">
        <form className="panel request-form" onSubmit={create}>
          <div className="panel-head">
            <h2>Neue Anfrage</h2>
          </div>
          <div className="request-form-body">
            <label>
              Art
              <select name="requestType" defaultValue="VACATION">
                <option value="VACATION">Urlaub</option>
                <option value="SICK">Krankheit</option>
                <option value="UNPAID">Unbezahlte Freistellung</option>
                <option value="OTHER">Sonstiges</option>
              </select>
            </label>
            <div className="modal-row">
              <label>
                Von
                <input name="startsOn" type="date" required />
              </label>
              <label>
                Bis
                <input name="endsOn" type="date" required />
              </label>
            </div>
            <label>
              Notiz
              <textarea
                name="note"
                maxLength={500}
                placeholder="Optionaler Hinweis"
              />
            </label>
            <button className="btn primary" disabled={loading}>
              {loading ? "Wird gesendet …" : "Anfrage senden"}
            </button>
          </div>
        </form>
        <section className="panel">
          <div className="panel-head">
            <h2>{manager ? "Anfragen des Teams" : "Meine Anfragen"}</h2>
          </div>
          {requests.length === 0 ? (
            <div className="empty">Noch keine Anfragen vorhanden.</div>
          ) : (
            requests.map((item) => (
              <article className="request-row" key={item.id}>
                <div>
                  <strong>{item.userName}</strong>
                  <span>
                    {typeName[item.requestType]} ·{" "}
                    {new Date(item.startsOn).toLocaleDateString("de-DE")} –{" "}
                    {new Date(item.endsOn).toLocaleDateString("de-DE")}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>
                <span className={`request-status ${item.status.toLowerCase()}`}>
                  {statusName[item.status]}
                </span>
                {item.status === "PENDING" && manager ? (
                  <div className="request-actions">
                    <button
                      className="btn approve"
                      onClick={() => update(item.id, "APPROVED")}
                    >
                      Genehmigen
                    </button>
                    <button
                      className="btn"
                      onClick={() => update(item.id, "DECLINED")}
                    >
                      Ablehnen
                    </button>
                  </div>
                ) : item.status === "PENDING" &&
                  item.userId === currentUserId ? (
                  <button
                    className="btn"
                    onClick={() => update(item.id, "CANCELLED")}
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
    </div>
  );
}
