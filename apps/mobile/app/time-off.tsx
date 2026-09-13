import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { timeOffAction } from "@/api";
import { useSession } from "@/session";
import { colors } from "@/theme";

const types = [
  ["VACATION", "Urlaub"],
  ["SICK", "Krank"],
  ["UNPAID", "Unbezahlt"],
  ["OTHER", "Sonstiges"],
] as const;
const labels: Record<string, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  DECLINED: "Abgelehnt",
  CANCELLED: "Storniert",
};
export default function MobileTimeOff() {
  const { data, refresh } = useSession();
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [requestType, setType] =
    useState<(typeof types)[number][0]>("VACATION");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await timeOffAction({
        action: "CREATE",
        startsOn,
        endsOn,
        requestType,
        note,
      });
      await refresh();
      setStartsOn("");
      setEndsOn("");
      setNote("");
    } catch (reason) {
      Alert.alert(
        "Nicht möglich",
        reason instanceof Error ? reason.message : "Bitte versuche es erneut.",
      );
    } finally {
      setBusy(false);
    }
  };
  const cancel = async (id: string) => {
    try {
      await timeOffAction({ action: "CANCEL", id });
      await refresh();
    } catch (reason) {
      Alert.alert(
        "Nicht möglich",
        reason instanceof Error ? reason.message : "Bitte versuche es erneut.",
      );
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Abwesenheit</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Neue Anfrage</Text>
        <View style={styles.types}>
          {types.map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setType(value)}
              style={[styles.type, requestType === value && styles.typeActive]}
            >
              <Text
                style={[
                  styles.typeText,
                  requestType === value && styles.typeTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Von</Text>
        <TextInput
          value={startsOn}
          onChangeText={setStartsOn}
          placeholder="JJJJ-MM-TT"
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.label}>Bis</Text>
        <TextInput
          value={endsOn}
          onChangeText={setEndsOn}
          placeholder="JJJJ-MM-TT"
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.label}>Notiz</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional"
          multiline
          style={[styles.input, styles.note]}
        />
        <Pressable
          disabled={busy || !startsOn || !endsOn}
          onPress={submit}
          style={[
            styles.submit,
            (busy || !startsOn || !endsOn) && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.submitText}>
            {busy ? "Wird gesendet …" : "Anfrage senden"}
          </Text>
        </Pressable>
        <Text style={styles.section}>MEINE ANFRAGEN</Text>
        {data?.requests.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {types.find(([value]) => value === item.type)?.[1] ?? item.type}
              </Text>
              <Text style={styles.cardDate}>
                {new Date(item.startsOn).toLocaleDateString("de-DE")} –{" "}
                {new Date(item.endsOn).toLocaleDateString("de-DE")}
              </Text>
              <Text style={styles.status}>{labels[item.status]}</Text>
            </View>
            {item.status === "PENDING" && (
              <Pressable onPress={() => cancel(item.id)}>
                <Text style={styles.cancel}>Stornieren</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 58,
    paddingHorizontal: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  content: { padding: 16, paddingBottom: 40 },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 14,
  },
  types: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  type: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  typeActive: { backgroundColor: colors.green, borderColor: colors.green },
  typeText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  typeTextActive: { color: "white" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    paddingHorizontal: 13,
    backgroundColor: "white",
    fontSize: 15,
    color: colors.text,
  },
  note: { height: 76, paddingTop: 12, textAlignVertical: "top" },
  submit: {
    height: 49,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  submitText: { color: "white", fontWeight: "800", fontSize: 15 },
  section: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.7,
    marginTop: 28,
    marginBottom: 9,
  },
  card: {
    padding: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "white",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  cardDate: { fontSize: 12, color: colors.muted, marginTop: 4 },
  status: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.green,
    marginTop: 7,
  },
  cancel: { fontSize: 12, fontWeight: "700", color: colors.danger },
});
