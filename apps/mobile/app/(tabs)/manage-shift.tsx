import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createManagedShift } from "@/api";
import { useSession } from "@/session";
import { colors } from "@/theme";

const pad = (value: number) => String(value).padStart(2, "0");
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function ManageShiftScreen() {
  const { data, refresh } = useSession();
  const management = data?.management;
  const tomorrow = useMemo(() => { const value = new Date(); value.setDate(value.getDate() + 1); return localDate(value); }, []);
  const [date, setDate] = useState(tomorrow);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState("30");
  const [notes, setNotes] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState(management?.locations[0]?.id ?? "");
  const [positionId, setPositionId] = useState(management?.positions[0]?.id ?? "");
  const [taskListId, setTaskListId] = useState("");
  const [busy, setBusy] = useState(false);

  if (!management) {
    return <SafeAreaView style={styles.safe}><View style={styles.header}><Back /><Text style={styles.title}>Schicht erstellen</Text><View style={{ width: 24 }} /></View><View style={styles.empty}><Text style={styles.muted}>Diese Funktion ist nur für Manager verfügbar.</Text></View></SafeAreaView>;
  }

  const save = async () => {
    if (!locationId || !positionId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      Alert.alert("Angaben prüfen", "Bitte Datum, Uhrzeit, Standort und Position vollständig angeben.");
      return;
    }
    setBusy(true);
    try {
      await createManagedShift({
        assigneeId: employeeId,
        locationId,
        positionId,
        startsAt: new Date(`${date}T${start}:00`).toISOString(),
        endsAt: new Date(`${date}T${end}:00`).toISOString(),
        unpaidBreakMin: Math.max(0, Number(breakMinutes) || 0),
        notes: notes.trim() || undefined,
        taskListId: taskListId || null,
      });
      await refresh();
      Alert.alert("Schicht erstellt", employeeId ? "Die Schicht wurde als Entwurf gespeichert." : "Die OpenShift wurde erstellt.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (reason) {
      Alert.alert("Nicht möglich", reason instanceof Error ? reason.message : "Bitte versuche es erneut.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Back /><Text style={styles.title}>Schicht erstellen</Text><Pressable disabled={busy} onPress={save}><Text style={[styles.save, busy && { opacity: 0.5 }]}>{busy ? "…" : "Speichern"}</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>ZEIT</Text>
        <View style={styles.card}>
          <Field label="Datum" value={date} onChangeText={setDate} placeholder="JJJJ-MM-TT" />
          <View style={styles.row}><View style={{ flex: 1 }}><Field label="Beginn" value={start} onChangeText={setStart} placeholder="09:00" /></View><View style={{ flex: 1 }}><Field label="Ende" value={end} onChangeText={setEnd} placeholder="17:00" /></View></View>
          <Field label="Unbezahlte Pause (Min.)" value={breakMinutes} onChangeText={setBreakMinutes} keyboardType="number-pad" />
        </View>
        <Text style={styles.section}>ZUWEISUNG</Text>
        <Choice label="Mitarbeiter" items={[{ id: "", name: "OpenShift" }, ...management.employees.filter((item) => item.isActive)]} value={employeeId ?? ""} onChange={(value) => setEmployeeId(value || null)} />
        <Choice label="Standort" items={management.locations} value={locationId} onChange={setLocationId} />
        <Choice label="Position" items={management.positions} value={positionId} onChange={setPositionId} />
        <Choice label="Aufgabenliste" items={[{ id: "", name: "Keine" }, ...management.taskLists]} value={taskListId} onChange={setTaskListId} />
        <Text style={styles.section}>NOTIZ</Text>
        <TextInput multiline value={notes} onChangeText={setNotes} placeholder="Optionale Hinweise für das Team" placeholderTextColor={colors.muted} style={styles.notes} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Back() { return <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={25} color={colors.navy} /></Pressable>; }
function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "number-pad" }) { return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={styles.input} /></View>; }
function Choice({ label, items, value, onChange }: { label: string; items: Array<{ id: string; name: string }>; value: string; onChange: (value: string) => void }) { return <View style={styles.choice}><Text style={styles.label}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{items.map((item) => <Pressable key={item.id || "open"} onPress={() => onChange(item.id)} style={[styles.chip, value === item.id && styles.chipActive]}><Text style={[styles.chipText, value === item.id && styles.chipTextActive]}>{item.name}</Text></Pressable>)}</ScrollView></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { height: 58, paddingHorizontal: 16, backgroundColor: "white", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.text, fontSize: 18, fontWeight: "700" }, save: { color: colors.green, fontWeight: "700", fontSize: 14 }, content: { padding: 16, paddingBottom: 40 }, section: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7, marginTop: 14, marginBottom: 8 }, card: { backgroundColor: "white", borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 14 }, row: { flexDirection: "row", gap: 12 }, field: { flex: 1, marginBottom: 13 }, label: { color: colors.text, fontSize: 12, fontWeight: "700", marginBottom: 7 }, input: { height: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, color: colors.text, backgroundColor: "#FBFCFD" }, choice: { backgroundColor: "white", borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 14, marginBottom: 9 }, chips: { gap: 8 }, chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }, chipActive: { backgroundColor: colors.green, borderColor: colors.green }, chipText: { color: colors.text, fontSize: 12, fontWeight: "600" }, chipTextActive: { color: "white" }, notes: { minHeight: 100, backgroundColor: "white", borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 13, color: colors.text, textAlignVertical: "top" }, empty: { padding: 32, alignItems: "center" }, muted: { color: colors.muted, textAlign: "center" },
});
