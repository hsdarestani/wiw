import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { SessionProvider } from "@/session";

export default function RootLayout() {
  const router = useRouter();
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data.type === "MESSAGE") router.push("/(tabs)/inbox");
      else if (data.href === "/schedule") router.push("/(tabs)/schedule");
      else if (data.href === "/time-off") router.push("/(tabs)/requests");
      else if (data.href === "/time-clock") router.push("/(tabs)/clock");
      else router.push("/(tabs)/notifications");
    });
    return () => subscription.remove();
  }, [router]);
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </SessionProvider>
  );
}
