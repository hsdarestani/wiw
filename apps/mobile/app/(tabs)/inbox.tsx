import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView } from "react-native";
import { PageHeader, shared } from "@/components";
import { Text, View } from "react-native";
import { colors } from "@/theme";

export default function Inbox() {
  return (
    <SafeAreaView style={shared.safe}>
      <PageHeader
        title="Postfach"
        action={
          <Ionicons name="create-outline" size={23} color={colors.navy} />
        }
      />
      <ScrollView contentContainerStyle={shared.content}>
        <View style={shared.empty}>
          <Ionicons name="chatbubbles-outline" size={42} color="#9AA8B2" />
          <Text style={shared.emptyTitle}>Alles erledigt</Text>
          <Text style={shared.emptyText}>
            Direktnachrichten und Teamankündigungen erscheinen hier.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
