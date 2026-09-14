import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <SettingsForm user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, hourlyRate: Number(user.hourlyRate), organization: user.organization.name, industry: user.organization.industry ?? "" }} />;
}
