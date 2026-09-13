import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "@/session";
import { colors } from "@/theme";

export default function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
      router.replace("/(tabs)/schedule");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Anmeldung fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.brand}>SchichtPro</Text>
          <Text style={styles.tagline}>Deine Arbeit. Dein Team. Ein Ort.</Text>
        </View>
        <View style={styles.sheet}>
          <Text style={styles.title}>Willkommen zurück</Text>
          <Text style={styles.subtitle}>
            Melde dich bei deinem Arbeitsplatz an.
          </Text>
          <Text style={styles.label}>E-Mail-Adresse</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={colors.muted} />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="name@unternehmen.de"
              style={styles.input}
              value={email}
            />
          </View>
          <Text style={styles.label}>Passwort</Text>
          <View style={styles.inputRow}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.muted}
            />
            <TextInput
              onChangeText={setPassword}
              placeholder="Passwort"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>
          <Pressable>
            <Text style={styles.forgot}>Passwort vergessen?</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={busy || !email || password.length < 8}
            onPress={submit}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Anmelden</Text>
            )}
          </Pressable>
          <Text style={styles.join}>
            Du hast einen Einladungscode?{" "}
            <Text style={styles.joinLink}>Arbeitsplatz beitreten</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  keyboard: { flex: 1, justifyContent: "flex-end" },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 36,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: { color: "white", fontSize: 35, fontWeight: "800" },
  brand: {
    color: "white",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tagline: { color: "#AEC0CE", fontSize: 14, marginTop: 5 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 5,
    marginBottom: 22,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 10,
  },
  inputRow: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FBFCFD",
  },
  input: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    color: colors.text,
    fontSize: 16,
  },
  forgot: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 12,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  button: {
    height: 52,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.52 },
  join: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 21,
    fontSize: 13,
  },
  joinLink: { color: colors.blue, fontWeight: "600" },
});
