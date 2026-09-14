import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { markNotificationRead } from "@/api";
import { PageHeader, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";
export default function Notifications() {
  const { data, refresh } = useSession();
  const read = async (id?: string) => { await markNotificationRead(id); await refresh(); };
  return <SafeAreaView style={shared.safe}><PageHeader title="Mitteilungen" action={data?.notifications.some((item) => !item.readAt) ? <Pressable onPress={() => read()}><Text style={styles.readAll}>Alle gelesen</Text></Pressable> : null} /><ScrollView contentContainerStyle={shared.content}>{!data?.notifications.length ? <View style={shared.empty}><Ionicons name="notifications-outline" size={42} color="#9AA8B2" /><Text style={shared.emptyTitle}>Keine Mitteilungen</Text></View> : data.notifications.map((item) => <Pressable key={item.id} style={[styles.row, !item.readAt && styles.unread]} onPress={async () => { await read(item.id); if (item.href === "/messages") router.push("/inbox"); else if (item.href) router.push(item.href as never); }}><View style={styles.icon}><Ionicons name={item.type === "MESSAGE" ? "chatbubble-outline" : "calendar-outline"} size={20} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleString("de-DE")}</Text></View>{!item.readAt && <View style={styles.dot} />}</Pressable>)}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ readAll: { color: colors.green, fontWeight: "700", fontSize: 12 }, row: { flexDirection: "row", gap: 11, padding: 14, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: colors.line }, unread: { backgroundColor: colors.greenSoft }, icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "white", alignItems: "center", justifyContent: "center" }, title: { color: colors.text, fontSize: 14, fontWeight: "800" }, body: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, time: { color: "#95A0A7", fontSize: 10, marginTop: 5 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green, marginTop: 5 } });
