"use client";
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Copy,
  MoreVertical,
  Plus,
  Send,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Member = { id: string; name: string; hourlyRate: number };
type Item = {
  id: string;
  assigneeId: string | null;
  startsAt: string;
  endsAt: string;
  unpaidBreakMin: number;
  status: string;
  position: { name: string; color: string };
  location: { name: string };
};
export function ScheduleBoard({
  monday,
  members,
  locations,
  positions,
  shifts,
  templates,
}: {
  monday: string;
  members: Member[];
  locations: { id: string; name: string }[];
  positions: { id: string; name: string; color: string }[];
  shifts: Item[];
  templates: { id: string; name: string; shiftCount: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setUTCDate(d.getUTCDate() + i);
        return d;
      }),
    [monday],
  );
  const end = new Date(days[6]);
  end.setUTCDate(end.getUTCDate() + 1);
  const hours = shifts.reduce(
    (sum, s) =>
      sum +
      (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) /
        3600000 -
      s.unpaidBreakMin / 60,
    0,
  );
  const cost = shifts.reduce(
    (sum, s) =>
      sum +
      ((new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) /
        3600000 -
        s.unpaidBreakMin / 60) *
        (members.find((m) => m.id === s.assigneeId)?.hourlyRate || 0),
    0,
  );
  const nav = (offset: number) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + offset * 7);
    router.push(`/schedule?week=${d.toISOString().slice(0, 10)}`);
  };
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/shifts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assigneeId: data.get("assigneeId") || null,
        locationId: data.get("locationId"),
        positionId: data.get("positionId"),
        startsAt: new Date(String(data.get("startsAt"))).toISOString(),
        endsAt: new Date(String(data.get("endsAt"))).toISOString(),
        unpaidBreakMin: Number(data.get("unpaidBreakMin") || 0),
      }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }
  async function remove(id: string) {
    if (!confirm("Diese Schicht wirklich löschen?")) return;
    await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function publish() {
    await fetch("/api/shifts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ startsAt: monday, endsAt: end.toISOString() }),
    });
    router.refresh();
  }
  async function copyWeek() {
    setError("");
    const response = await fetch("/api/shifts/copy-week", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ startsAt: monday, endsAt: end.toISOString() }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    nav(1);
  }
  async function saveTemplate() {
    setLoading(true); setError("");
    const response = await fetch("/api/schedule-templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: templateName, startsAt: monday, endsAt: end.toISOString() }) });
    const body = await response.json(); setLoading(false);
    if (!response.ok) { setError(body.error); return; }
    setTemplateName(""); router.refresh();
  }
  async function applyTemplate(id: string) {
    setLoading(true); setError("");
    const response = await fetch(`/api/schedule-templates/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetMonday: monday }) });
    const body = await response.json(); setLoading(false);
    if (!response.ok) { setError(body.error); return; }
    setTemplatesOpen(false); router.refresh();
  }
  async function deleteTemplate(id: string) {
    if (!confirm("Dieses Template wirklich löschen?")) return;
    const response = await fetch(`/api/schedule-templates/${id}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json(); setError(body.error); return; }
    router.refresh();
  }
  async function moveShift(
    shiftId: string,
    assigneeId: string | null,
    targetDay: Date,
  ) {
    const shift = shifts.find((item) => item.id === shiftId);
    if (!shift) return;
    setError("");
    const oldStart = new Date(shift.startsAt),
      oldEnd = new Date(shift.endsAt);
    const startsAt = new Date(targetDay);
    startsAt.setUTCHours(
      oldStart.getUTCHours(),
      oldStart.getUTCMinutes(),
      0,
      0,
    );
    const endsAt = new Date(
      startsAt.getTime() + oldEnd.getTime() - oldStart.getTime(),
    );
    const response = await fetch(`/api/shifts/${shiftId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assigneeId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    router.refresh();
  }
  return (
    <div className="scheduler-page">
      <div className="scheduler-banner">
        <strong>Dein Dienstplan ist bereit</strong>
        <span>Erstelle Schichten und veröffentliche sie für dein Team.</span>
      </div>
      <div className="scheduler-heading">
        <div>
          <h1>{days[0].toLocaleDateString("de-DE", { day: "2-digit", month: "short" })} – {days[6].toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}</h1>
          <p>Dienstplan nach Mitarbeitern</p>
        </div>
        <div className="scheduler-heading-actions">
          <button className="square-tool" title="Automatisch zuweisen"><WandSparkles size={17} /></button>
          <button className="square-tool" onClick={copyWeek} title="Vorwoche kopieren"><Copy size={17} /></button>
          <button className="square-tool" title="Vorlagen" onClick={() => setTemplatesOpen(true)}><CalendarRange size={17} /></button>
          <button className="square-tool" title="Weitere Aktionen"><MoreVertical size={17} /></button>
        </div>
      </div>
      <div className="planner-shell">
        <aside className="schedule-filters">
          <div className="filter-title"><SlidersHorizontal size={15} /> Filter</div>
          <label>Positionen<select><option>Alle Positionen</option>{positions.map((p) => <option key={p.id}>{p.name}</option>)}</select></label>
          <label>Standorte<select><option>Alle Standorte</option>{locations.map((l) => <option key={l.id}>{l.name}</option>)}</select></label>
          <label>Mitarbeiter<select><option>Alle Mitarbeiter</option>{members.map((m) => <option key={m.id}>{m.name}</option>)}</select></label>
          <div className="filter-title secondary">Weitere Werkzeuge</div>
          <label className="filter-toggle"><span>Prognose</span><input type="checkbox" /></label>
          <label className="filter-toggle"><span>Aufgabenlisten</span><input type="checkbox" /></label>
        </aside>
        <div className="planner-main">
      <div className="toolbar">
        <div className="week-control">
          <button onClick={() => nav(-1)}>
            <ChevronLeft size={17} />
          </button>
          <span>
            {days[0].toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
            })}{" "}
            –{" "}
            {days[6].toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <button onClick={() => nav(1)}>
            <ChevronRight size={17} />
          </button>
        </div>
        <button className="btn" onClick={() => router.push("/schedule")}>
          Heute
        </button>
        <span className="toolbar-spacer" />
        <button className="btn publish" onClick={publish}>
          <Send size={15} />
          Veröffentlichen
        </button>
        <button className="btn primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Schicht hinzufügen
        </button>
      </div>
      {error && !open && (
        <div className="auth-error schedule-error">{error}</div>
      )}
      <section className="stats">
        <div className="stat">
          <div className="stat-label">Geplante Stunden</div>
          <div className="stat-value">{hours.toFixed(1)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Lohnkosten</div>
          <div className="stat-value">€ {cost.toFixed(2)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Offene Schichten</div>
          <div className="stat-value warning">
            {shifts.filter((s) => s.status === "OPEN").length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Unveröffentlicht</div>
          <div className="stat-value">
            {shifts.filter((s) => s.status === "DRAFT").length}
          </div>
        </div>
      </section>
      <div className="schedule-wrap">
        <div className="schedule">
          <div className="head">Mitarbeiter</div>
          {days.map((day) => (
            <div className="head" key={day.toISOString()}>
              <div className="day-name">
                {day.toLocaleDateString("de-DE", { weekday: "short" })}
              </div>
              <div className="day-date">
                {day.toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            </div>
          ))}
          {members.flatMap((member) => [
            <div className="employee" key={`${member.id}-name`}>
              <span className="avatar">
                {member.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <div className="employee-name">{member.name}</div>
                <div className="employee-role">
                  {member.hourlyRate
                    ? `€ ${member.hourlyRate.toFixed(2)} / Std.`
                    : "Mitarbeiter"}
                </div>
              </div>
            </div>,
            ...days.map((day) => (
              <div
                className="cell"
                key={`${member.id}-${day.toISOString()}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) =>
                  moveShift(
                    event.dataTransfer.getData("text/shift-id"),
                    member.id,
                    day,
                  )
                }
              >
                {shifts
                  .filter(
                    (s) =>
                      s.assigneeId === member.id &&
                      new Date(s.startsAt).toDateString() ===
                        day.toDateString(),
                  )
                  .map((s) => (
                    <Shift key={s.id} item={s} remove={remove} />
                  ))}
              </div>
            )),
          ])}
          <div className="employee">
            <div>
              <div className="employee-name">Offene Schichten</div>
              <div className="employee-role">Für das Team verfügbar</div>
            </div>
          </div>
          {days.map((day) => (
            <div
              className="cell"
              key={`open-${day.toISOString()}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) =>
                moveShift(
                  event.dataTransfer.getData("text/shift-id"),
                  null,
                  day,
                )
              }
            >
              {shifts
                .filter(
                  (s) =>
                    !s.assigneeId &&
                    new Date(s.startsAt).toDateString() === day.toDateString(),
                )
                .map((s) => (
                  <Shift key={s.id} item={s} remove={remove} />
                ))}
            </div>
          ))}
        </div>
      </div>
        </div>
      </div>
      {open && (
        <div className="modal-backdrop">
          <form className="shift-modal" onSubmit={create}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <h2>Schicht hinzufügen</h2>
            {error && <div className="auth-error">{error}</div>}
            <label>
              Mitarbeiter
              <select name="assigneeId">
                <option value="">Offene Schicht</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Position
              <select name="positionId" required>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Standort
              <select name="locationId" required>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-row">
              <label>
                Beginn
                <input name="startsAt" type="datetime-local" required />
              </label>
              <label>
                Ende
                <input name="endsAt" type="datetime-local" required />
              </label>
            </div>
            <label>
              Unbezahlte Pause
              <input
                name="unpaidBreakMin"
                type="number"
                min="0"
                max="480"
                defaultValue="0"
              />
            </label>
            <button className="auth-submit" disabled={loading}>
              {loading ? "Wird gespeichert …" : "Schicht speichern"}
            </button>
          </form>
        </div>
      )}
      {templatesOpen && (
        <div className="modal-backdrop">
          <div className="shift-modal template-modal">
            <button type="button" className="modal-close" onClick={() => setTemplatesOpen(false)}><X size={18} /></button>
            <h2>Dienstplan-Templates</h2>
            {error && <div className="auth-error">{error}</div>}
            <div className="template-create">
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Name des Templates" maxLength={80} />
              <button className="btn primary" disabled={loading || !templateName.trim() || !shifts.length} onClick={saveTemplate}>Aktuelle Woche speichern</button>
            </div>
            <div className="template-list">
              {templates.map((template) => (
                <div className="template-row" key={template.id}>
                  <div><strong>{template.name}</strong><small>{template.shiftCount} Schichten</small></div>
                  <div><button className="btn" disabled={loading} onClick={() => applyTemplate(template.id)}>Anwenden</button><button className="icon-button danger" onClick={() => deleteTemplate(template.id)} aria-label="Template löschen"><Trash2 size={16} /></button></div>
                </div>
              ))}
              {!templates.length && <p className="template-empty">Noch keine Templates gespeichert.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Shift({ item, remove }: { item: Item; remove: (id: string) => void }) {
  const start = new Date(item.startsAt),
    end = new Date(item.endsAt);
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/shift-id", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="shift"
      style={{
        borderLeftColor: item.position.color,
        background: `${item.position.color}18`,
      }}
    >
      <button className="shift-delete" onClick={() => remove(item.id)}>
        <Trash2 size={12} />
      </button>
      <div className="shift-time">
        {start.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        –{" "}
        {end.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className="shift-role">
        {item.position.name} · {item.location.name}
      </div>
    </div>
  );
}
