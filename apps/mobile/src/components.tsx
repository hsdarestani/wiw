import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Shift } from "./api";
import { colors } from "./theme";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function ShiftCard({
  shift,
  open = false,
}: {
  shift: Shift;
  open?: boolean;
}) {
  const start = new Date(shift.startsAt);
  const end = new Date(shift.endsAt);
  return (
    <Pressable
      style={({ pressed }) => [styles.shift, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.shiftBar, { backgroundColor: shift.color }]} />
      <View style={styles.shiftTime}>
        <Text style={styles.time}>
          {start.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.end}>
          {end.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <View style={styles.shiftInfo}>
        <Text style={styles.position}>{shift.position}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.meta}>{shift.location}</Text>
        </View>
      </View>
      {open ? (
        <View style={styles.openPill}>
          <Text style={styles.openText}>Offen</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={19} color="#9CA8B1" />
      )}
    </Pressable>
  );
}

export const shared = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { alignItems: "center", padding: 32, marginTop: 24 },
  emptyTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 17,
    marginTop: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 5,
  },
});

const styles = StyleSheet.create({
  header: {
    height: 58,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.35,
  },
  shift: {
    minHeight: 79,
    backgroundColor: "white",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 9,
    paddingRight: 13,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  shiftBar: { width: 5, alignSelf: "stretch" },
  shiftTime: { width: 73, paddingLeft: 12 },
  time: { color: colors.text, fontSize: 15, fontWeight: "700" },
  end: { color: colors.muted, fontSize: 12, marginTop: 3 },
  shiftInfo: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.line,
    paddingLeft: 13,
  },
  position: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 5,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  meta: { color: colors.muted, fontSize: 12 },
  openPill: {
    borderRadius: 12,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  openText: { color: colors.green, fontSize: 11, fontWeight: "700" },
});
