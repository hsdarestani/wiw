import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { inviteEmployee, updateEmployee } from "@/api";
import { useSession } from "@/session";
import { colors } from "@/theme";

const roleLabels: Record<string, string> = { OWNER: "Inhaber", ADMIN: "Administrator", MANAGER: "Manager", EMPLOYEE: "Mitarbeiter" };
const editableRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];

export default function TeamScreen() {
  const { data, refresh } = useSession();
  const employees = data?.management?.employees ?? [];
  const canManage = ["OWNER", "ADMIN"].includes(data?.user.role ?? "");
  const canInvite = ["OWNER", "ADMIN", "MANAGER"].includes(data?.user.role ?? "");
  const [editing, setEditing] = useState<(typeof employees)[number] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [rate, setRate] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const openEmployee = (employee: (typeof employees)[number]) => {
    const locked = !canManage || employee.role === "OWNER" || employee.id === data?.user.id || (data?.user.role === "ADMIN" && employee.role === "ADMIN");
    if (locked) return;
    setEditing(employee); setRole(employee.role); setRate(String(employee.hourlyRate)); setActive(employee.isActive);
  };
  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try { await updateEmployee(editing.id, role, Number(rate) || 0, active); await refresh(); setEditing(null); }
    catch (reason) { Alert.alert("Nicht möglich", reason instanceof Error ? reason.message : "Bitte erneut versuchen."); }
    finally { setBusy(false); }
  };
  const invite = async () => {
    setBusy(true);
    try { const result = await inviteEmployee(email.trim(), role); setInviteOpen(false); setEmail(""); setRole("EMPLOYEE"); Alert.alert("Einladung erstellt", `Code: ${result.invitation.code}\nGültig für 7 Tage.`); }
    catch (reason) { Alert.alert("Nicht möglich", reason instanceof Error ? reason.message : "Bitte erneut versuchen."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.navy} /></Pressable><Text style={styles.headerTitle}>Team</Text>{canInvite ? <Pressable onPress={() => { setRole("EMPLOYEE"); setInviteOpen(true); }}><Ionicons name="person-add-outline" size={24} color={colors.green} /></Pressable> : <View style={{ width: 24 }} />}</View>
    <ScrollView contentContainerStyle={styles.content}>{employees.map((employee) => <Pressable key={employee.id} onPress={() => openEmployee(employee)} style={[styles.member, !employee.isActive && styles.inactive]}><View style={styles.avatar}><Text style={styles.avatarText}>{employee.name.split(" ").map((item) => item[0]).slice(0, 2).join("")}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{employee.name}</Text><Text style={styles.meta}>{employee.email}</Text><Text style={styles.meta}>{roleLabels[employee.role] ?? employee.role} · € {employee.hourlyRate.toFixed(2)}/Std.</Text></View><View style={[styles.status, employee.isActive ? styles.active : styles.disabled]}><Text style={styles.statusText}>{employee.isActive ? "Aktiv" : "Inaktiv"}</Text></View>{canManage && employee.role !== "OWNER" && employee.id !== data?.user.id && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}</Pressable>)}</ScrollView>
    <Modal visible={Boolean(editing)} animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.safe}><SheetHeader title="Mitarbeiter bearbeiten" onClose={() => setEditing(null)} /><ScrollView contentContainerStyle={styles.sheet}><Text style={styles.sheetName}>{editing?.name}</Text><Text style={styles.label}>Rolle</Text><RolePicker value={role} onChange={setRole} roles={editableRoles} /><Text style={styles.label}>Stundensatz (€)</Text><TextInput value={rate} onChangeText={setRate} keyboardType="decimal-pad" style={styles.input} /><Text style={styles.label}>Status</Text><View style={styles.roleRow}><Chip label="Aktiv" selected={active} onPress={() => setActive(true)} /><Chip label="Inaktiv" selected={!active} onPress={() => setActive(false)} /></View><Pressable disabled={busy} onPress={save} style={[styles.primary, busy && { opacity: .5 }]}><Text style={styles.primaryText}>{busy ? "Speichern …" : "Änderungen speichern"}</Text></Pressable></ScrollView></SafeAreaView></Modal>
    <Modal visible={inviteOpen} animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.safe}><SheetHeader title="Mitarbeiter einladen" onClose={() => setInviteOpen(false)} /><ScrollView contentContainerStyle={styles.sheet}><Text style={styles.label}>E-Mail (optional)</Text><TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="name@firma.de" style={styles.input} /><Text style={styles.label}>Rolle</Text><RolePicker value={role} onChange={setRole} roles={data?.user.role === "MANAGER" ? ["EMPLOYEE"] : editableRoles} /><Pressable disabled={busy} onPress={invite} style={[styles.primary, busy && { opacity: .5 }]}><Text style={styles.primaryText}>{busy ? "Erstellen …" : "Einladung erstellen"}</Text></Pressable></ScrollView></SafeAreaView></Modal>
  </SafeAreaView>;
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) { return <View style={styles.header}><View style={{ width: 24 }} /><Text style={styles.headerTitle}>{title}</Text><Pressable onPress={onClose}><Ionicons name="close" size={25} color={colors.navy} /></Pressable></View>; }
function RolePicker({ value, onChange, roles }: { value: string; onChange: (value: string) => void; roles: string[] }) { return <View style={styles.roleRow}>{roles.map((item) => <Chip key={item} label={roleLabels[item]} selected={value === item} onPress={() => onChange(item)} />)}</View>; }
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { height: 58, paddingHorizontal: 16, backgroundColor: "white", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { color: colors.text, fontSize: 18, fontWeight: "800" }, content: { padding: 14, gap: 9, paddingBottom: 40 }, member: { backgroundColor: "white", borderWidth: 1, borderColor: colors.line, borderRadius: 11, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, inactive: { opacity: .62 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E4EEF1", alignItems: "center", justifyContent: "center" }, avatarText: { color: colors.navy, fontWeight: "800" }, name: { color: colors.text, fontWeight: "800", fontSize: 15 }, meta: { color: colors.muted, fontSize: 11, marginTop: 3 }, status: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 }, active: { backgroundColor: "#DDF4E9" }, disabled: { backgroundColor: "#ECEFF1" }, statusText: { color: colors.text, fontSize: 9, fontWeight: "800" }, sheet: { padding: 18 }, sheetName: { color: colors.navy, fontSize: 20, fontWeight: "800", marginBottom: 22 }, label: { color: colors.text, fontSize: 12, fontWeight: "800", marginTop: 16, marginBottom: 8 }, input: { height: 48, backgroundColor: "white", borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 13, color: colors.text }, roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "white" }, chipSelected: { backgroundColor: colors.green, borderColor: colors.green }, chipText: { color: colors.text, fontSize: 12, fontWeight: "700" }, chipTextSelected: { color: "white" }, primary: { marginTop: 28, height: 50, borderRadius: 25, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" }, primaryText: { color: "white", fontWeight: "800" } });
