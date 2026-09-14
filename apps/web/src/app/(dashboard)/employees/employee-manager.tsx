"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Member = { id: string; name: string; email: string; role: string; hourlyRate: number; isActive: boolean };
const labels: Record<string, string> = { OWNER: "Inhaber", ADMIN: "Administrator", MANAGER: "Manager", EMPLOYEE: "Mitarbeiter" };
export function EmployeeManager({ members, canManage, currentUserId }: { members: Member[]; canManage: boolean; currentUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function save(member: Member, form: HTMLFormElement) {
    setBusy(member.id); setError("");
    const data = new FormData(form);
    const response = await fetch(`/api/employees/${member.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: data.get("role"), hourlyRate: data.get("hourlyRate"), isActive: data.get("isActive") === "true" }) });
    const body = await response.json(); setBusy("");
    if (!response.ok) return setError(body.error);
    router.refresh();
  }
  return <>{error && <div className="auth-error" style={{ margin: 14 }}>{error}</div>}{members.map((member) => {
    const locked = !canManage || member.role === "OWNER" || member.id === currentUserId;
    return <form className="member-row" key={member.id} onSubmit={(event) => { event.preventDefault(); save(member, event.currentTarget); }}>
      <div className="member"><span className="avatar">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><strong>{member.name}</strong><small>{member.email}</small></div></div>
      <select name="role" defaultValue={member.role} disabled={locked} aria-label="Rolle"><option value="EMPLOYEE">Mitarbeiter</option><option value="MANAGER">Manager</option><option value="ADMIN">Administrator</option>{member.role === "OWNER" && <option value="OWNER">Inhaber</option>}</select>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input name="hourlyRate" type="number" min="0" max="100000" step="0.01" defaultValue={member.hourlyRate} disabled={!canManage} style={{ width: 82 }} /> €/Std.</label>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}><select name="isActive" defaultValue={String(member.isActive)} disabled={locked} aria-label="Status"><option value="true">Aktiv</option><option value="false">Inaktiv</option></select>{canManage && <button className="btn" disabled={busy === member.id || member.role === "OWNER"}>{busy === member.id ? "…" : "Speichern"}</button>}</div>
    </form>;
  })}</>;
}
