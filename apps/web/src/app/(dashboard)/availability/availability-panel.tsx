"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type Rule = {
  id: string;
  userId: string;
  userName: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  available: boolean;
};
const days = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
export function AvailabilityPanel({
  currentUserId,
  manager,
  rules,
}: {
  currentUserId: string;
  manager: boolean;
  rules: Rule[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/availability", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        weekday: Number(data.get("weekday")),
        startsAt: data.get("startsAt"),
        endsAt: data.get("endsAt"),
        available: data.get("available") === "true",
      }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    router.refresh();
  }
  async function remove(id: string) {
    const response = await fetch(`/api/availability/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError((await response.json()).error);
      return;
    }
    router.refresh();
  }
  const people = [
    ...new Map(rules.map((rule) => [rule.userId, rule.userName])).entries(),
  ];
  if (!people.some(([id]) => id === currentUserId))
    people.unshift([currentUserId, "Meine Verfügbarkeit"]);
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>Verfügbarkeit</h1>
          <p>Wiederkehrende Arbeitszeiten für die Wochenplanung.</p>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="availability-layout">
        <form className="panel request-form" onSubmit={create}>
          <div className="panel-head">
            <h2>Regel hinzufügen</h2>
          </div>
          <div className="request-form-body">
            <label>
              Wochentag
              <select name="weekday" defaultValue="1">
                {days.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="available" defaultValue="true">
                <option value="true">Verfügbar</option>
                <option value="false">Nicht verfügbar</option>
              </select>
            </label>
            <div className="modal-row">
              <label>
                Von
                <input
                  name="startsAt"
                  type="time"
                  defaultValue="09:00"
                  required
                />
              </label>
              <label>
                Bis
                <input
                  name="endsAt"
                  type="time"
                  defaultValue="17:00"
                  required
                />
              </label>
            </div>
            <button className="btn primary" disabled={loading}>
              {loading ? "Wird gespeichert …" : "Regel speichern"}
            </button>
          </div>
        </form>
        <section className="panel availability-panel">
          <div className="panel-head">
            <h2>{manager ? "Verfügbarkeit des Teams" : "Meine Woche"}</h2>
          </div>
          {people.map(([userId, userName]) => (
            <div className="availability-person" key={userId}>
              <strong>{userName}</strong>
              <div className="availability-week">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                  <div className="availability-day" key={day}>
                    <span>{days[day].slice(0, 2)}</span>
                    {rules
                      .filter(
                        (rule) =>
                          rule.userId === userId && rule.weekday === day,
                      )
                      .map((rule) => (
                        <div
                          className={`availability-slot ${rule.available ? "yes" : "no"}`}
                          key={rule.id}
                        >
                          {time(rule.startMinute)}–{time(rule.endMinute)}
                          {rule.userId === currentUserId && (
                            <button onClick={() => remove(rule.id)}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
