import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./invite-form";
import { EmployeeManager } from "./employee-manager";

const roleName = {
  OWNER: "Inhaber",
  ADMIN: "Administrator",
  MANAGER: "Manager",
  EMPLOYEE: "Mitarbeiter",
} as const;
export default async function EmployeesPage() {
  const current = await getCurrentUser();
  if (!current) return null;
  const [members, locations, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: current.organizationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.location.findMany({
      where: { organizationId: current.organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.invitation.findMany({
      where: {
        organizationId: current.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>Mitarbeiter</h1>
          <p>
            {members.length} Teammitglieder in {current.organization.name}
          </p>
        </div>
      </div>
      <div className="team-grid">
        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>Team</h2>
              <input
                className="search-input"
                placeholder="Mitarbeiter suchen"
              />
            </div>
            <EmployeeManager
              currentUserId={current.id}
              canManage={["OWNER", "ADMIN"].includes(current.role)}
              members={members.map((member) => ({
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                email: member.email,
                role: member.role,
                hourlyRate: Number(member.hourlyRate),
                isActive: member.isActive,
              }))}
            />
          </section>
          {invitations.length > 0 && (
            <section className="panel invite-list">
              <div className="panel-head">
                <h2>Offene Einladungen</h2>
              </div>
              {invitations.map((invite) => (
                <div className="invite-item" key={invite.id}>
                  <span>
                    {invite.email || "Einladungslink"}
                    <small> · {roleName[invite.role]}</small>
                  </span>
                  <strong>{invite.code}</strong>
                </div>
              ))}
            </section>
          )}
        </div>
        <InviteForm locations={locations} />
      </div>
    </div>
  );
}
