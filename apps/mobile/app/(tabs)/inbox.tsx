import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { sendMessage } from "@/api";
import { PageHeader, shared } from "@/components";
import { useSession } from "@/session";
import { colors } from "@/theme";

export default function Inbox() {
  const { data, refresh } = useSession();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!content.trim()) return;
    setBusy(true);
    try {
      await sendMessage(content.trim());
      setContent("");
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
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <PageHeader title="Nachrichten" />
        <ScrollView contentContainerStyle={styles.list}>
          {!data?.messages.length ? (
            <View style={shared.empty}>
              <Ionicons name="chatbubbles-outline" size={42} color="#9AA8B2" />
              <Text style={shared.emptyTitle}>Noch keine Nachrichten</Text>
              <Text style={shared.emptyText}>
                Starte die Unterhaltung mit deinem Team.
              </Text>
            </View>
          ) : (
            data.messages.map((item) => {
              const mine = item.authorId === data.user.id;
              return (
                <View
                  key={item.id}
                  style={[styles.message, mine && styles.mine]}
                >
                  <View style={styles.meta}>
                    <Text style={styles.author}>{item.authorName}</Text>
                    <Text style={styles.time}>
                      {new Date(item.createdAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.body}>{item.content}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
        <View style={styles.compose}>
          <TextInput
            multiline
            maxLength={2000}
            placeholder="Nachricht schreiben …"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={content}
            onChangeText={setContent}
          />
          <Pressable
            disabled={busy || !content.trim()}
            onPress={submit}
            style={[styles.send, (!content.trim() || busy) && styles.disabled]}
          >
            <Ionicons name="send" color="white" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 9, flexGrow: 1 },
  message: {
    alignSelf: "flex-start",
    maxWidth: "86%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    borderBottomLeftRadius: 3,
    padding: 11,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.greenSoft,
    borderColor: "#BFE5D3",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 3,
  },
  meta: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 5 },
  author: { color: colors.navy, fontSize: 11, fontWeight: "800" },
  time: { color: colors.muted, fontSize: 9 },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  compose: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 105,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.45 },
});
