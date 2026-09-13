import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { PageHeader, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";

const statusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  DECLINED: "Abgelehnt",
  CANCELLED: "Storniert",
};
const typeLabel: Record<string, string> = {
  VACATION: "Urlaub",
  SICK: "Krank",
  UNPAID: "Unbezahlt",
  OTHER: "Sonstiges",
};

export default function Requests() {
  const { data } = useSession();
  return (
    <SafeAreaView style={shared.safe}>
      <PageHeader
        title="Anfragen"
        action={
          <View style={styles.add}>
            <Ionicons name="add" size={23} color="white" />
          </View>
        }
      />
      <ScrollView contentContainerStyle={shared.content}>
        <View style={styles.segment}>
          <View style={styles.active}>
            <Text style={styles.activeText}>Meine Anfragen</Text>
          </View>
          <Text style={styles.segmentText}>Verlauf</Text>
        </View>
        {data?.requests.map((request) => (
          <View key={request.id} style={styles.card}>
            <View style={styles.icon}>
              <Ionicons
                name="calendar-outline"
                size={21}
                color={colors.green}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {typeLabel[request.type] ?? request.type}
              </Text>
              <Text style={styles.dates}>
                {new Date(request.startsOn).toLocaleDateString("de-DE")} –{" "}
                {new Date(request.endsOn).toLocaleDateString("de-DE")}
              </Text>
            </View>
            <View
              style={[
                styles.status,
                request.status === "APPROVED" && styles.approved,
              ]}
            >
              <Text style={styles.statusText}>
                {statusLabel[request.status] ?? request.status}
              </Text>
            </View>
          </View>
        ))}
        {!data?.requests.length ? (
          <View style={shared.empty}>
            <Ionicons
              name="swap-horizontal-outline"
              size={42}
              color="#9AA8B2"
            />
            <Text style={shared.emptyTitle}>Noch keine Anfragen</Text>
            <Text style={shared.emptyText}>
              Urlaub, Verfügbarkeit und Schichttausch werden hier gebündelt.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  add: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    height: 42,
    padding: 3,
    backgroundColor: "#E5E9EC",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  active: {
    flex: 1,
    height: 36,
    backgroundColor: "white",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  activeText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  segmentText: {
    flex: 1,
    color: colors.muted,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    minHeight: 76,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    marginBottom: 9,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: "700" },
  dates: { color: colors.muted, fontSize: 12, marginTop: 4 },
  status: {
    backgroundColor: "#FFF4D6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  approved: { backgroundColor: colors.greenSoft },
  statusText: { color: colors.text, fontSize: 10, fontWeight: "700" },
});
