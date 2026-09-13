import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "@/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </SessionProvider>
  );
}
