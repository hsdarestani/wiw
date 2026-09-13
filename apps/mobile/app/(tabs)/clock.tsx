import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { timeClockAction } from "@/api";
import { PageHeader, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";

const elapsed = (start: string, end: string | null, now: number) => {
  const minutes = Math.max(
    0,
    Math.floor(
      ((end ? new Date(end).getTime() : now) - new Date(start).getTime()) /
        60000,
    ),
  );
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
};
export default function ClockScreen() {
  const { data, refresh } = useSession();
  const active = data?.timeEntries.find((item) => !item.clockOut);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const total = useMemo(
    () =>
      data?.timeEntries.reduce(
        (sum, item) =>
          sum +
          (item.clockOut
            ? new Date(item.clockOut).getTime() -
              new Date(item.clockIn).getTime()
            : 0),
        0,
      ) ?? 0,
    [data?.timeEntries],
  );
  const toggle = async () => {
    setBusy(true);
    try {
      await timeClockAction(active ? "CLOCK_OUT" : "CLOCK_IN");
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
  return (
    <SafeAreaView style={shared.safe}>
      <PageHeader title="Zeiterfassung" />
      <ScrollView contentContainerStyle={shared.content}>
        <View style={[styles.clock, active && styles.running]}>
          <Text style={styles.kicker}>
            {active ? "ARBEITSZEIT LÄUFT" : "BEREIT ZUM START"}
          </Text>
          <Text style={styles.timer}>
            {active
              ? elapsed(active.clockIn, null, now)
              : new Date(now).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
          </Text>
          <Text style={styles.hint}>
            {active
              ? `Gestartet um ${new Date(active.clockIn).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
              : "Du bist derzeit nicht eingestempelt."}
          </Text>
          <Pressable disabled={busy} onPress={toggle} style={styles.button}>
            <Ionicons
              name={active ? "stop-circle" : "play-circle"}
              size={23}
              color={active ? colors.danger : colors.green}
            />
            <Text
              style={[styles.buttonText, active && { color: colors.danger }]}
            >
              {busy ? "Bitte warten …" : active ? "Ausstempeln" : "Einstempeln"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>LETZTE 5 WOCHEN</Text>
            <Text style={styles.summaryValue}>
              {(total / 3600000).toFixed(1)} Std.
            </Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>EINTRÄGE</Text>
            <Text style={styles.summaryValue}>
              {data?.timeEntries.filter((item) => item.clockOut).length ?? 0}
            </Text>
          </View>
        </View>
        <Text style={styles.heading}>LETZTE EINTRÄGE</Text>
        {!data?.timeEntries.length ? (
          <View style={shared.empty}>
            <Ionicons name="time-outline" size={42} color="#9AA8B2" />
            <Text style={shared.emptyTitle}>Noch keine Arbeitszeit</Text>
          </View>
        ) : (
          data.timeEntries.map((item) => (
            <View key={item.id} style={styles.row}>
              <View>
                <Text style={styles.date}>
                  {new Date(item.clockIn).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </Text>
                <Text style={styles.range}>
                  {new Date(item.clockIn).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {item.clockOut
                    ? new Date(item.clockOut).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "läuft"}
                </Text>
              </View>
              <Text style={styles.hours}>
                {elapsed(item.clockIn, item.clockOut, now)} Std.
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  clock: {
    marginTop: 16,
    borderRadius: 14,
    padding: 25,
    alignItems: "center",
    backgroundColor: colors.navy,
  },
  running: { backgroundColor: "#176749" },
  kicker: {
    color: "#BED0DB",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  timer: {
    color: "white",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -2,
    marginTop: 13,
    fontVariant: ["tabular-nums"],
  },
  hint: { color: "#D5E1E7", fontSize: 13, marginTop: 5 },
  button: {
    height: 50,
    minWidth: 190,
    marginTop: 22,
    borderRadius: 25,
    backgroundColor: "white",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.green, fontSize: 15, fontWeight: "800" },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 17,
    marginTop: 12,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 5,
  },
  heading: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginTop: 24,
    marginBottom: 9,
  },
  row: {
    minHeight: 65,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    backgroundColor: "white",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: { color: colors.text, fontSize: 14, fontWeight: "700" },
  range: { color: colors.muted, fontSize: 12, marginTop: 4 },
  hours: { color: colors.green, fontSize: 13, fontWeight: "800" },
});
