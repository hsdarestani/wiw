import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/theme";
import { useSession } from "@/session";

export default function Index() {
  const { loading, signedIn } = useSession();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }
  return <Redirect href={signedIn ? "/(tabs)/schedule" : "/login"} />;
}
