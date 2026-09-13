import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { PageHeader, ShiftCard, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";

export default function OpenShifts() {
  const { data } = useSession();
  return (
    <SafeAreaView style={shared.safe}>
      <PageHeader
        title="OpenShifts"
        action={
          <Ionicons name="options-outline" size={23} color={colors.navy} />
        }
      />
      <ScrollView contentContainerStyle={shared.content}>
        <Text style={styles.intro}>Verfügbare Schichten</Text>
        <Text style={styles.help}>
          Diese Schichten wurden deinem Team angeboten.
        </Text>
        {data?.openShifts.map((shift) => (
          <View key={shift.id} style={styles.group}>
            <Text style={styles.date}>
              {new Date(shift.startsAt).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <ShiftCard shift={shift} open />
          </View>
        ))}
        {!data?.openShifts.length ? (
          <View style={shared.empty}>
            <Ionicons name="flash-outline" size={42} color="#9AA8B2" />
            <Text style={shared.emptyTitle}>Keine offenen Schichten</Text>
            <Text style={shared.emptyText}>
              Sobald dein Team eine Schicht anbietet, kannst du sie hier
              übernehmen.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  intro: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 20 },
  help: { color: colors.muted, fontSize: 14, marginTop: 5, marginBottom: 22 },
  group: { marginBottom: 13 },
  date: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
});
