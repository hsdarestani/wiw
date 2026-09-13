import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { colors } from "@/theme";
import { useSession } from "@/session";

const icon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => (
    <Ionicons color={color} name={name} size={size} />
  );

export default function TabsLayout() {
  const { loading, signedIn } = useSession();
  if (!loading && !signedIn) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: "#71808A",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", paddingBottom: 2 },
        tabBarStyle: {
          height: 82,
          paddingTop: 7,
          borderTopColor: colors.line,
          backgroundColor: "white",
        },
      }}
    >
      <Tabs.Screen
        name="schedule"
        options={{ title: "Dienstplan", tabBarIcon: icon("calendar") }}
      />
      <Tabs.Screen
        name="open"
        options={{ title: "OpenShifts", tabBarIcon: icon("flash") }}
      />
      <Tabs.Screen
        name="clock"
        options={{ title: "Stempeluhr", tabBarIcon: icon("time") }}
      />
      <Tabs.Screen
        name="requests"
        options={{ title: "Anfragen", tabBarIcon: icon("swap-horizontal") }}
      />
      <Tabs.Screen name="inbox" options={{ href: null }} />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mehr",
          tabBarIcon: icon("ellipsis-horizontal-circle"),
        }}
      />
    </Tabs>
  );
}
