import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  Alert,
  RefreshControl,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { shiftAction } from "@/api";
import { PageHeader, ShiftCard, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export default function ScheduleScreen() {
  const { data, refresh } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState("");
  const offer = async (shiftId: string) => {
    setBusy(shiftId);
    try {
      await shiftAction({ action: "OFFER_SWAP", shiftId });
      await refresh();
      Alert.alert(
        "Schicht angeboten",
        "Dein Team kann die Schicht jetzt zur Übernahme anfragen.",
      );
    } catch (reason) {
      Alert.alert(
        "Nicht möglich",
        reason instanceof Error ? reason.message : "Bitte versuche es erneut.",
      );
    } finally {
      setBusy("");
    }
  };
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return date;
    });
  }, []);
  const grouped = new Map<string, NonNullable<typeof data>["shifts"]>();
  data?.shifts.forEach((shift) => {
    const key = dayKey(new Date(shift.startsAt));
    grouped.set(key, [...(grouped.get(key) ?? []), shift]);
  });
  const hours =
    data?.shifts.reduce(
      (sum, shift) =>
        sum +
        (new Date(shift.endsAt).getTime() -
          new Date(shift.startsAt).getTime()) /
          3_600_000 -
        shift.breakMinutes / 60,
      0,
    ) ?? 0;
  return (
    <SafeAreaView style={shared.safe}>
      <PageHeader
        title="Mein Dienstplan"
        action={
          <Pressable onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={23} color={colors.navy} />
            {(data?.notifications.filter((item) => !item.readAt).length ?? 0) > 0 && <View style={{ position: "absolute", right: -2, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />}
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={shared.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh().finally(() => setRefreshing(false));
            }}
            tintColor={colors.green}
          />
        }
      >
        <View style={styles.workplace}>
          <View style={styles.workplaceIcon}>
            <Ionicons name="business" size={18} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workplaceName}>{data?.user.organization}</Text>
            <Text style={styles.workplaceSub}>
              Alle Positionen · Alle Standorte
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </View>
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>NÄCHSTE 14 TAGE</Text>
            <Text style={styles.summaryValue}>
              {data?.shifts.length ?? 0} Schichten
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryLabel}>GEPLANTE ZEIT</Text>
            <Text style={styles.summaryValue}>{hours.toFixed(1)} Std.</Text>
          </View>
        </View>
        {days.map((date) => {
          const shifts = grouped.get(dayKey(date)) ?? [];
          if (!shifts.length) return null;
          const today = dayKey(date) === dayKey(new Date());
          return (
            <View key={dayKey(date)} style={styles.day}>
              <View style={styles.dayHeading}>
                <Text style={[styles.dayName, today && styles.today]}>
                  {today
                    ? "HEUTE"
                    : date
                        .toLocaleDateString("de-DE", { weekday: "long" })
                        .toUpperCase()}
                </Text>
                <Text style={styles.dayDate}>
                  {date.toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                  })}
                </Text>
              </View>
              {shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  actionLabel="Anbieten"
                  busy={busy === shift.id}
                  onAction={() => offer(shift.id)}
                />
              ))}
            </View>
          );
        })}
        {!data?.shifts.length ? (
          <View style={shared.empty}>
            <Ionicons name="calendar-outline" size={42} color="#9AA8B2" />
            <Text style={shared.emptyTitle}>Keine geplanten Schichten</Text>
            <Text style={shared.emptyText}>
              Veröffentlichte Schichten erscheinen hier automatisch.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  workplace: {
    marginTop: 14,
    height: 64,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  workplaceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  workplaceName: { color: colors.text, fontSize: 14, fontWeight: "700" },
  workplaceSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  summary: {
    marginTop: 11,
    marginBottom: 22,
    borderRadius: 9,
    backgroundColor: colors.navy,
    padding: 15,
    flexDirection: "row",
  },
  summaryLabel: {
    color: "#AFC1CE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  summaryValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.navySoft,
    marginHorizontal: 26,
  },
  day: { marginBottom: 16 },
  dayHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  dayName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dayDate: { color: colors.muted, fontSize: 12 },
  today: { color: colors.green },
});
