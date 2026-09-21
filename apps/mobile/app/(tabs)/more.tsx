import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PageHeader, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";

const rows: Array<[keyof typeof Ionicons.glyphMap, string, string | null]> = [
  ["calendar-outline", "Abwesenheiten", "/time-off"],
  ["calendar-number-outline", "Verfügbarkeit", "/availability"],
  ["people-outline", "Team", "/team"],
  ["timer-outline", "Arbeitszeiten prüfen", "/timesheets"],
  ["settings-outline", "Passwort ändern", "/password"],
  ["help-circle-outline", "Hilfe & Support", null],
];
export default function More() {
  const { data, signOut } = useSession();
  const initials = `${data?.user.firstName?.[0] ?? ""}${data?.user.lastName?.[0] ?? ""}`;
  return (
    <SafeAreaView style={shared.safe}>
      <PageHeader title="Mehr" />
      <ScrollView contentContainerStyle={shared.content}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>
              {data?.user.firstName} {data?.user.lastName}
            </Text>
            <Text style={styles.company}>{data?.user.organization}</Text>
          </View>
        </View>
        <View style={styles.menu}>
          {rows.filter(([, label]) => label !== "Arbeitszeiten prüfen" || ["OWNER", "ADMIN", "MANAGER"].includes(data?.user.role ?? "")).map(([icon, label, href]) => (
            <Pressable
              key={label}
              style={styles.row}
              onPress={() => href && router.push(href as never)}
            >
              <Ionicons name={icon} size={21} color={colors.navy} />
              <Text style={styles.label}>{label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9AA8B2" />
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.logout}
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Abmelden</Text>
        </Pressable>
        <Text style={styles.version}>SchichtPro 0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  profile: {
    marginVertical: 16,
    borderRadius: 10,
    backgroundColor: colors.navy,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  avatarText: { color: "white", fontSize: 17, fontWeight: "800" },
  name: { color: "white", fontSize: 17, fontWeight: "700" },
  company: { color: "#B6C6D0", fontSize: 13, marginTop: 4 },
  menu: {
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  row: {
    height: 57,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  label: {
    flex: 1,
    marginLeft: 13,
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  logout: {
    marginTop: 18,
    height: 52,
    borderRadius: 9,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: "700" },
  version: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    marginTop: 22,
  },
});
