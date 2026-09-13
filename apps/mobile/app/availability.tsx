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
import { availabilityAction } from "@/api";
import { useSession } from "@/session";
import { colors } from "@/theme";

const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export default function MobileAvailability() {
  const { data, refresh } = useSession();
  const [weekday, setWeekday] = useState(1);
  const [startsAt, setStart] = useState("09:00");
  const [endsAt, setEnd] = useState("17:00");
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try {
      await availabilityAction({
        action: "CREATE",
        weekday,
        startsAt,
        endsAt,
        available,
      });
      await refresh();
    } catch (reason) {
      Alert.alert(
        "Nicht möglich",
        reason instanceof Error ? reason.message : "Bitte versuche es erneut.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    try {
      await availabilityAction({ action: "DELETE", id });
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
        <Text style={styles.headerTitle}>Verfügbarkeit</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.help}>
          Lege deine wiederkehrenden wöchentlichen Zeiten fest.
        </Text>
        <View style={styles.days}>
          {days.map((day, index) => (
            <Pressable
              key={day}
              onPress={() => setWeekday(index)}
              style={[styles.day, weekday === index && styles.dayActive]}
            >
              <Text
                style={[
                  styles.dayText,
                  weekday === index && styles.dayTextActive,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.mode}>
          <Pressable
            onPress={() => setAvailable(true)}
            style={[styles.modeItem, available && styles.modeActive]}
          >
            <Text style={[styles.modeText, available && styles.modeTextActive]}>
              Verfügbar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAvailable(false)}
            style={[styles.modeItem, !available && styles.modeActive]}
          >
            <Text
              style={[styles.modeText, !available && styles.modeTextActive]}
            >
              Nicht verfügbar
            </Text>
          </Pressable>
        </View>
        <View style={styles.times}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Von</Text>
            <TextInput
              style={styles.input}
              value={startsAt}
              onChangeText={setStart}
              placeholder="09:00"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Bis</Text>
            <TextInput
              style={styles.input}
              value={endsAt}
              onChangeText={setEnd}
              placeholder="17:00"
            />
          </View>
        </View>
        <Pressable
          disabled={busy}
          onPress={create}
          style={[styles.submit, busy && { opacity: 0.5 }]}
        >
          <Text style={styles.submitText}>
            {busy ? "Speichert …" : "Regel hinzufügen"}
          </Text>
        </Pressable>
        <Text style={styles.section}>WOCHENPLAN</Text>
        {days.map((day, index) => {
          const rules =
            data?.availability.filter((rule) => rule.weekday === index) ?? [];
          if (!rules.length) return null;
          return (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.dayName}>{day}</Text>
              <View style={{ flex: 1 }}>
                {rules.map((rule) => (
                  <View
                    key={rule.id}
                    style={[styles.rule, !rule.available && styles.unavailable]}
                  >
                    <View>
                      <Text style={styles.ruleTime}>
                        {clock(rule.startMinute)} – {clock(rule.endMinute)}
                      </Text>
                      <Text style={styles.ruleMode}>
                        {rule.available ? "Verfügbar" : "Nicht verfügbar"}
                      </Text>
                    </View>
                    <Pressable onPress={() => remove(rule.id)}>
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
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
  help: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 16 },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  day: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: { backgroundColor: colors.green, borderColor: colors.green },
  dayText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  dayTextActive: { color: "white" },
  mode: {
    height: 43,
    padding: 3,
    borderRadius: 9,
    backgroundColor: "#E5E9EC",
    flexDirection: "row",
    marginBottom: 12,
  },
  modeItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  modeActive: { backgroundColor: "white" },
  modeText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  modeTextActive: { color: colors.text },
  times: { flexDirection: "row", gap: 10 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    paddingHorizontal: 13,
    backgroundColor: "white",
    fontSize: 16,
    color: colors.text,
  },
  submit: {
    height: 49,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitText: { color: "white", fontSize: 15, fontWeight: "800" },
  section: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.7,
    marginTop: 28,
    marginBottom: 10,
  },
  dayGroup: { flexDirection: "row", gap: 10, marginBottom: 10 },
  dayName: {
    width: 27,
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    paddingTop: 13,
  },
  rule: {
    minHeight: 58,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    borderRadius: 8,
    backgroundColor: "white",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  unavailable: { borderLeftColor: colors.danger },
  ruleTime: { fontSize: 14, fontWeight: "700", color: colors.text },
  ruleMode: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
