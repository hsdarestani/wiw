import { useState } from "react";
import { router } from "expo-router";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { changePassword } from "@/api";
import { PageHeader, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";
export default function Password() {
  const { signOut } = useSession();
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (next.length < 10) return Alert.alert("Hinweis", "Das neue Passwort muss mindestens 10 Zeichen lang sein.");
    if (next !== confirm) return Alert.alert("Hinweis", "Die neuen Passwörter stimmen nicht überein.");
    setBusy(true);
    try { await changePassword(current, next); await signOut(); Alert.alert("Passwort geändert", "Bitte melde dich erneut an."); router.replace("/login"); }
    catch (reason) { Alert.alert("Nicht möglich", reason instanceof Error ? reason.message : "Bitte versuche es erneut."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={shared.safe}><PageHeader title="Passwort ändern" /><View style={styles.content}><Text style={styles.help}>Nach der Änderung wirst du aus Sicherheitsgründen auf allen Geräten abgemeldet.</Text><TextInput secureTextEntry autoCapitalize="none" placeholder="Aktuelles Passwort" placeholderTextColor={colors.muted} style={styles.input} value={current} onChangeText={setCurrent} /><TextInput secureTextEntry autoCapitalize="none" placeholder="Neues Passwort (mind. 10 Zeichen)" placeholderTextColor={colors.muted} style={styles.input} value={next} onChangeText={setNext} /><TextInput secureTextEntry autoCapitalize="none" placeholder="Neues Passwort bestätigen" placeholderTextColor={colors.muted} style={styles.input} value={confirm} onChangeText={setConfirm} /><Pressable disabled={busy || !current || !next || !confirm} style={[styles.button, busy && { opacity: .55 }]} onPress={submit}><Text style={styles.buttonText}>{busy ? "Wird geändert …" : "Passwort ändern"}</Text></Pressable></View></SafeAreaView>;
}
const styles = StyleSheet.create({ content: { padding: 18, gap: 12 }, help: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 5 }, input: { height: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: "white", paddingHorizontal: 14, color: colors.text }, button: { height: 50, borderRadius: 9, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", marginTop: 6 }, buttonText: { color: "white", fontSize: 15, fontWeight: "800" } });
