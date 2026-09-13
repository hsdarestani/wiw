import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
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

export default function OpenShifts() {
  const { data, refresh } = useSession();
  const [busy, setBusy] = useState("");
  const run = async (body: Record<string, string>, id: string) => {
    setBusy(id);
    try {
      await shiftAction(body);
      await refresh();
      Alert.alert(
        "Anfrage gesendet",
        "Ein Manager kann die Übernahme jetzt bestätigen.",
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
            <ShiftCard
              shift={shift}
              actionLabel="Anfragen"
              busy={busy === shift.id}
              onAction={() =>
                run({ action: "CLAIM_OPEN", shiftId: shift.id }, shift.id)
              }
            />
          </View>
        ))}
        {data?.swapOffers.length ? (
          <Text style={styles.section}>VON KOLLEGEN ANGEBOTEN</Text>
        ) : null}
        {data?.swapOffers.map((offer) => (
          <View key={offer.id} style={styles.group}>
            <Text style={styles.date}>
              {offer.owner ?? "Teammitglied"} ·{" "}
              {new Date(offer.shift.startsAt).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <ShiftCard
              shift={offer.shift}
              actionLabel="Übernehmen"
              busy={busy === offer.id}
              onAction={() =>
                run({ action: "CLAIM_SWAP", tradeId: offer.id }, offer.id)
              }
            />
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
  section: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 12,
  },
});
